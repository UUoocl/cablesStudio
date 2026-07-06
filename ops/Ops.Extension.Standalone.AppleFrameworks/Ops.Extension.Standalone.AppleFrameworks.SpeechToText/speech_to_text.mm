#include <node_api.h>
#import <AVFoundation/AVFoundation.h>
#import <Speech/Speech.h>
#import <CoreAudio/CoreAudio.h>
#import <AudioToolbox/AudioToolbox.h>
#import <Foundation/Foundation.h>
#include <vector>
#include <string>
#include <iostream>
#include <cmath>

struct SpeechEventData {
    std::string type;
    std::string text;
    bool is_final;
    std::vector<std::pair<std::string, std::string>> devices;
    std::string status;
};

// Forward declaration of C++ helper to invoke napi threadsafe callback
void CallJSCallback(napi_env env, napi_value js_cb, void* context, void* data);

static NSBundle* GetMainAppBundle() {
    NSBundle* bundle = [NSBundle mainBundle];
    NSString* path = [bundle bundlePath];
    NSRange range = [path rangeOfString:@"/Contents/Frameworks/"];
    if (range.location != NSNotFound) {
        NSString* mainPath = [path substringToIndex:range.location];
        NSBundle* outerBundle = [NSBundle bundleWithPath:mainPath];
        if (outerBundle != nil) {
            return outerBundle;
        }
    }
    return bundle;
}

std::vector<std::pair<std::string, std::string>> getAudioInputDevicesCpp() {
    std::vector<std::pair<std::string, std::string>> list;
    list.push_back({"Default System Microphone", "Default"});
    
    AudioObjectPropertyAddress address = {
        kAudioHardwarePropertyDevices,
        kAudioObjectPropertyScopeGlobal,
        kAudioObjectPropertyElementMain
    };
    
    UInt32 size = 0;
    OSStatus status = AudioObjectGetPropertyDataSize(kAudioObjectSystemObject, &address, 0, nil, &size);
    if (status != noErr) return list;
    
    int count = size / sizeof(AudioDeviceID);
    std::vector<AudioDeviceID> devices(count);
    status = AudioObjectGetPropertyData(kAudioObjectSystemObject, &address, 0, nil, &size, devices.data());
    if (status != noErr) return list;
    
    for (AudioDeviceID device : devices) {
        AudioObjectPropertyAddress streamAddress = {
            kAudioDevicePropertyStreams,
            kAudioObjectPropertyScopeInput,
            kAudioObjectPropertyElementMain
        };
        
        UInt32 streamSize = 0;
        status = AudioObjectGetPropertyDataSize(device, &streamAddress, 0, nil, &streamSize);
        if (status != noErr || streamSize == 0) {
            continue;
        }
        
        AudioObjectPropertyAddress nameAddress = {
            kAudioDevicePropertyDeviceNameCFString,
            kAudioObjectPropertyScopeGlobal,
            kAudioObjectPropertyElementMain
        };
        CFStringRef nameString = nil;
        UInt32 nameSize = sizeof(CFStringRef);
        status = AudioObjectGetPropertyData(device, &nameAddress, 0, nil, &nameSize, &nameString);
        std::string name = "Unknown Input";
        if (status == noErr && nameString) {
            name = [(__bridge NSString*)nameString UTF8String];
            CFRelease(nameString);
        }
        
        AudioObjectPropertyAddress uidAddress = {
            kAudioDevicePropertyDeviceUID,
            kAudioObjectPropertyScopeGlobal,
            kAudioObjectPropertyElementMain
        };
        CFStringRef uidString = nil;
        UInt32 uidSize = sizeof(CFStringRef);
        status = AudioObjectGetPropertyData(device, &uidAddress, 0, nil, &uidSize, &uidString);
        std::string uid = "Unknown UID";
        if (status == noErr && uidString) {
            uid = [(__bridge NSString*)uidString UTF8String];
            CFRelease(uidString);
        }
        
        list.push_back({name, uid});
    }
    
    return list;
}

AudioDeviceID getAudioDeviceIDCpp(const std::string& uid) {
    AudioObjectPropertyAddress address = {
        kAudioHardwarePropertyDevices,
        kAudioObjectPropertyScopeGlobal,
        kAudioObjectPropertyElementMain
    };
    
    UInt32 size = 0;
    OSStatus status = AudioObjectGetPropertyDataSize(kAudioObjectSystemObject, &address, 0, nil, &size);
    if (status != noErr) return 0;
    
    int count = size / sizeof(AudioDeviceID);
    std::vector<AudioDeviceID> devices(count);
    status = AudioObjectGetPropertyData(kAudioObjectSystemObject, &address, 0, nil, &size, devices.data());
    if (status != noErr) return 0;
    
    for (AudioDeviceID device : devices) {
        AudioObjectPropertyAddress uidAddress = {
            kAudioDevicePropertyDeviceUID,
            kAudioObjectPropertyScopeGlobal,
            kAudioObjectPropertyElementMain
        };
        
        CFStringRef uidString = nil;
        UInt32 uidSize = sizeof(CFStringRef);
        status = AudioObjectGetPropertyData(device, &uidAddress, 0, nil, &uidSize, &uidString);
        if (status == noErr && uidString) {
            std::string uidStr = [(__bridge NSString*)uidString UTF8String];
            CFRelease(uidString);
            if (uidStr == uid) {
                return device;
            }
        }
    }
    return 0;
}

@interface SpeechRecognizerEngine : NSObject {
    napi_threadsafe_function _ts_fn;
    NSString* _currentLocale;
    NSString* _currentDeviceUID;
    double _silenceDuration;
    NSDate* _lastActivityTime;
    BOOL _isSilentState;
    NSString* _lastText;
    BOOL _isRecording;
}

@property (nonatomic, strong) SFSpeechRecognizer* speechRecognizer;
@property (nonatomic, strong) SFSpeechAudioBufferRecognitionRequest* recognitionRequest;
@property (nonatomic, strong) SFSpeechRecognitionTask* recognitionTask;
@property (nonatomic, strong) AVAudioEngine* audioEngine;

- (instancetype)initWithCallback:(napi_threadsafe_function)ts_fn;
- (void)startRecordingWithLocale:(NSString*)locale deviceUID:(NSString*)deviceUID silenceDuration:(double)silenceDuration;
- (void)stopRecording;
- (void)setLocale:(NSString*)locale;
- (void)setAudioDevice:(NSString*)deviceUID;
- (void)setSilenceDuration:(double)seconds;
- (void)resetTranscription;
- (void)publishAudioDevices;
- (void)sendStatusEvent:(NSString*)status;

@end

static OSStatus AudioDeviceListChangedCallback(AudioObjectID inObjectID, UInt32 inNumberAddresses, const AudioObjectPropertyAddress* inAddresses, void* inClientData) {
    SpeechRecognizerEngine* engine = (__bridge SpeechRecognizerEngine*)inClientData;
    [engine publishAudioDevices];
    return noErr;
}

@implementation SpeechRecognizerEngine

- (instancetype)initWithCallback:(napi_threadsafe_function)ts_fn {
    self = [super init];
    if (self) {
        _ts_fn = ts_fn;
        _audioEngine = [[AVAudioEngine alloc] init];
        _currentLocale = @"en-US";
        _currentDeviceUID = @"Default";
        _silenceDuration = 1.5;
        _isRecording = NO;
        
        NSString* speechDesc = [GetMainAppBundle() objectForInfoDictionaryKey:@"NSSpeechRecognitionUsageDescription"];
        if (speechDesc != nil) {
            [SFSpeechRecognizer requestAuthorization:^(SFSpeechRecognizerAuthorizationStatus status) {
                // Check status asynchronously
            }];
        } else {
            NSLog(@"[SpeechToText] Warning: NSSpeechRecognitionUsageDescription is missing from Info.plist. RequestAuthorization was skipped to prevent a crash.");
        }
        
        // Register CoreAudio listener for hotplugging input devices
        AudioObjectPropertyAddress address = {
            kAudioHardwarePropertyDevices,
            kAudioObjectPropertyScopeGlobal,
            kAudioObjectPropertyElementMain
        };
        AudioObjectAddPropertyListener(kAudioObjectSystemObject, &address, AudioDeviceListChangedCallback, (__bridge void*)self);
    }
    return self;
}

- (void)dealloc {
    AudioObjectPropertyAddress address = {
        kAudioHardwarePropertyDevices,
        kAudioObjectPropertyScopeGlobal,
        kAudioObjectPropertyElementMain
    };
    AudioObjectRemovePropertyListener(kAudioObjectSystemObject, &address, AudioDeviceListChangedCallback, (__bridge void*)self);
    [self stopRecording];
}

- (void)startRecordingWithLocale:(NSString*)locale deviceUID:(NSString*)deviceUID silenceDuration:(double)silenceDuration {
    @synchronized (self) {
        _currentLocale = locale;
        _currentDeviceUID = deviceUID;
        _silenceDuration = silenceDuration;
        _isRecording = YES;
        
        [self startRecordingInternal];
    }
}

- (void)startRecordingInternal {
    NSString* speechDesc = [GetMainAppBundle() objectForInfoDictionaryKey:@"NSSpeechRecognitionUsageDescription"];
    if (speechDesc == nil) {
        [self sendStatusEvent:@"Missing Speech Permission Key in Info.plist"];
        return;
    }

    [self.audioEngine stop];

    [self.audioEngine.inputNode removeTapOnBus:0];
    if (self.recognitionTask) {
        [self.recognitionTask cancel];
        self.recognitionTask = nil;
    }
    
    self.speechRecognizer = [[SFSpeechRecognizer alloc] initWithLocale:[NSLocale localeWithLocaleIdentifier:_currentLocale]];
    if (!self.speechRecognizer || !self.speechRecognizer.available) {
        [self sendStatusEvent:@"Recognizer Not Available"];
        return;
    }
    
    self.recognitionRequest = [[SFSpeechAudioBufferRecognitionRequest alloc] init];
    self.recognitionRequest.shouldReportPartialResults = YES;
    
    // Enforce local speech processing (saves battery + local secure transcription)
    if (self.speechRecognizer.supportsOnDeviceRecognition) {
        self.recognitionRequest.requiresOnDeviceRecognition = YES;
    }
    
    AVAudioInputNode* inputNode = self.audioEngine.inputNode;
    
    // Bind device ID if configured
    if (_currentDeviceUID && ![_currentDeviceUID isEqualToString:@"Default"]) {
        AudioDeviceID deviceID = getAudioDeviceIDCpp([_currentDeviceUID UTF8String]);
        if (deviceID != 0) {
            AudioUnit inputAudioUnit = inputNode.audioUnit;
            if (inputAudioUnit) {
                AudioUnitSetProperty(
                    inputAudioUnit,
                    kAudioOutputUnitProperty_CurrentDevice,
                    kAudioUnitScope_Global,
                    0,
                    &deviceID,
                    sizeof(AudioDeviceID)
                );
            }
        }
    }
    
    AVAudioFormat* recordingFormat = [inputNode outputFormatForBus:0];
    if (recordingFormat.sampleRate <= 0 || recordingFormat.channelCount <= 0) {
        [self sendStatusEvent:@"Invalid Audio Input Format"];
        return;
    }
    
    _lastActivityTime = [NSDate date];
    _isSilentState = YES;
    _lastText = @"";
    
    [inputNode installTapOnBus:0 bufferSize:4096 format:recordingFormat block:^(AVAudioPCMBuffer* _Nonnull buffer, AVAudioTime* _Nonnull when) {
        @synchronized (self) {
            if (self.recognitionRequest) {
                // Calculate RMS amplitude for silence threshold
                float* channelData = buffer.floatChannelData[0];
                int frameLength = buffer.frameLength;
                if (channelData && frameLength > 0) {
                    float sum = 0;
                    for (int i = 0; i < frameLength; ++i) {
                        sum += channelData[i] * channelData[i];
                    }
                    float rms = sqrt(sum / frameLength);
                    float db = rms > 0.0001 ? 20.0f * log10f(rms) : -100.0f;
                    
                    BOOL wasSilent = _isSilentState;
                    if (db > -45.0f) { // Silence Threshold DB
                        _lastActivityTime = [NSDate date];
                        _isSilentState = NO;
                    }
                    
                    BOOL shouldReset = !wasSilent && ([[NSDate date] timeIntervalSinceDate:_lastActivityTime] > _silenceDuration);
                    if (shouldReset) {
                        _isSilentState = YES;
                        dispatch_async(dispatch_get_main_queue(), ^{
                            [self resetTranscription];
                        });
                    }
                }
                
                [self.recognitionRequest appendAudioPCMBuffer:buffer];
            }
        }
    }];
    
    [self.audioEngine prepare];
    NSError* startError = nil;
    [self.audioEngine startAndReturnError:&startError];
    if (startError) {
        [self sendStatusEvent:[NSString stringWithFormat:@"Audio Engine Start Failed"]];
        return;
    }
    
    self.recognitionTask = [self.speechRecognizer recognitionTaskWithRequest:self.recognitionRequest resultHandler:^(SFSpeechRecognitionResult* _Nullable result, NSError* _Nullable error) {
        if (result) {
            NSString* text = result.bestTranscription.formattedString;
            _lastText = text;
            [self sendTranscriptionEvent:text isFinal:result.isFinal];
        }
        
        if (error || (result && result.isFinal)) {
            @synchronized (self) {
                if (self.recognitionRequest) {
                    [self.audioEngine stop];
                    [self.audioEngine.inputNode removeTapOnBus:0];
                    self.recognitionRequest = nil;
                    self.recognitionTask = nil;
                }
            }
        }
    }];
    
    [self sendStatusEvent:@"Running"];
}

- (void)stopRecording {
    @synchronized (self) {
        _isRecording = NO;
        
        if (self.audioEngine.isRunning) {
            [self.audioEngine stop];
            [self.audioEngine.inputNode removeTapOnBus:0];
        }
        
        if (!_lastText || [_lastText isEqualToString:@""]) {
            // Nothing to flush
        } else {
            [self sendTranscriptionEvent:_lastText isFinal:YES];
            _lastText = @"";
        }
        
        [self.recognitionRequest endAudio];
        [self.recognitionTask cancel];
        self.recognitionRequest = nil;
        self.recognitionTask = nil;
        _isSilentState = YES;
        
        [self sendStatusEvent:@"Stopped"];
    }
}

- (void)setLocale:(NSString*)locale {
    @synchronized (self) {
        if ([_currentLocale isEqualToString:locale]) return;
        _currentLocale = locale;
        if (_isRecording) {
            [self startRecordingInternal];
        }
    }
}

- (void)setAudioDevice:(NSString*)deviceUID {
    @synchronized (self) {
        if ([_currentDeviceUID isEqualToString:deviceUID]) return;
        _currentDeviceUID = deviceUID;
        if (_isRecording) {
            [self startRecordingInternal];
        }
    }
}

- (void)setSilenceDuration:(double)seconds {
    @synchronized (self) {
        _silenceDuration = seconds;
    }
}

- (void)resetTranscription {
    @synchronized (self) {
        if (!_isRecording) return;
        
        // Send final chunk before resetting
        if (_lastText && ![_lastText isEqualToString:@""]) {
            [self sendTranscriptionEvent:_lastText isFinal:YES];
            _lastText = @"";
        }
        
        // Restart the recognition session on the existing audio input tap
        [self.recognitionRequest endAudio];
        [self.recognitionTask cancel];
        self.recognitionTask = nil;
        
        self.speechRecognizer = [[SFSpeechRecognizer alloc] initWithLocale:[NSLocale localeWithLocaleIdentifier:_currentLocale]];
        self.recognitionRequest = [[SFSpeechAudioBufferRecognitionRequest alloc] init];
        self.recognitionRequest.shouldReportPartialResults = YES;
        if (self.speechRecognizer.supportsOnDeviceRecognition) {
            self.recognitionRequest.requiresOnDeviceRecognition = YES;
        }
        
        self.recognitionTask = [self.speechRecognizer recognitionTaskWithRequest:self.recognitionRequest resultHandler:^(SFSpeechRecognitionResult* _Nullable result, NSError* _Nullable error) {
            if (result) {
                NSString* text = result.bestTranscription.formattedString;
                _lastText = text;
                [self sendTranscriptionEvent:text isFinal:result.isFinal];
            }
            
            if (error || (result && result.isFinal)) {
                @synchronized (self) {
                    if (self.recognitionRequest) {
                        [self.audioEngine stop];
                        [self.audioEngine.inputNode removeTapOnBus:0];
                        self.recognitionRequest = nil;
                        self.recognitionTask = nil;
                    }
                }
            }
        }];
    }
}

- (void)publishAudioDevices {
    SpeechEventData* event = new SpeechEventData();
    event->type = "devices";
    event->devices = getAudioInputDevicesCpp();
    
    napi_acquire_threadsafe_function(_ts_fn);
    napi_call_threadsafe_function(_ts_fn, event, napi_tsfn_nonblocking);
    napi_release_threadsafe_function(_ts_fn, napi_tsfn_release);
}

- (void)sendTranscriptionEvent:(NSString*)text isFinal:(BOOL)isFinal {
    SpeechEventData* event = new SpeechEventData();
    event->type = "transcription";
    event->text = [text UTF8String];
    event->is_final = isFinal;
    
    napi_acquire_threadsafe_function(_ts_fn);
    napi_call_threadsafe_function(_ts_fn, event, napi_tsfn_nonblocking);
    napi_release_threadsafe_function(_ts_fn, napi_tsfn_release);
}

- (void)sendStatusEvent:(NSString*)status {
    SpeechEventData* event = new SpeechEventData();
    event->type = "status";
    event->status = [status UTF8String];
    
    napi_acquire_threadsafe_function(_ts_fn);
    napi_call_threadsafe_function(_ts_fn, event, napi_tsfn_nonblocking);
    napi_release_threadsafe_function(_ts_fn, napi_tsfn_release);
}

@end

// Thread-safe NAPI callback invoker
void CallJSCallback(napi_env env, napi_value js_cb, void* context, void* data) {
    SpeechEventData* event = static_cast<SpeechEventData*>(data);
    
    napi_handle_scope scope = nullptr;
    napi_status scope_status = napi_open_handle_scope(env, &scope);
    if (scope_status != napi_ok) {
        delete event;
        return;
    }
    
    napi_value event_obj = nullptr;
    napi_create_object(env, &event_obj);
    
    napi_value type_val = nullptr;
    napi_create_string_utf8(env, event->type.c_str(), NAPI_AUTO_LENGTH, &type_val);
    napi_set_named_property(env, event_obj, "type", type_val);
    
    if (event->type == "transcription") {
        napi_value text_val = nullptr;
        napi_create_string_utf8(env, event->text.c_str(), NAPI_AUTO_LENGTH, &text_val);
        napi_set_named_property(env, event_obj, "text", text_val);
        
        napi_value final_val = nullptr;
        napi_get_boolean(env, event->is_final, &final_val);
        napi_set_named_property(env, event_obj, "isFinal", final_val);
    } else if (event->type == "devices") {
        napi_value dev_array = nullptr;
        napi_create_array_with_length(env, event->devices.size(), &dev_array);
        for (size_t i = 0; i < event->devices.size(); ++i) {
            napi_value dev_obj = nullptr;
            napi_create_object(env, &dev_obj);
            
            napi_value name_val = nullptr;
            napi_create_string_utf8(env, event->devices[i].first.c_str(), NAPI_AUTO_LENGTH, &name_val);
            napi_set_named_property(env, dev_obj, "name", name_val);
            
            napi_value id_val = nullptr;
            napi_create_string_utf8(env, event->devices[i].second.c_str(), NAPI_AUTO_LENGTH, &id_val);
            napi_set_named_property(env, dev_obj, "id", id_val);
            
            napi_set_element(env, dev_array, i, dev_obj);
        }
        napi_set_named_property(env, event_obj, "devices", dev_array);
    } else if (event->type == "status") {
        napi_value status_val = nullptr;
        napi_create_string_utf8(env, event->status.c_str(), NAPI_AUTO_LENGTH, &status_val);
        napi_set_named_property(env, event_obj, "status", status_val);
    }
    
    napi_value global = nullptr;
    napi_get_global(env, &global);
    
    napi_value result = nullptr;
    napi_call_function(env, global, js_cb, 1, &event_obj, &result);
    
    napi_close_handle_scope(env, scope);
    delete event;
}

// Global engine reference
static SpeechRecognizerEngine* g_engine = nil;
static napi_threadsafe_function g_ts_fn = nullptr;

napi_value InitRecognizer(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1] = {nullptr};
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    
    if (argc < 1) {
        napi_throw_type_error(env, nullptr, "Callback function required");
        return nullptr;
    }
    
    napi_value resource_name = nullptr;
    napi_create_string_utf8(env, "SpeechToTextCallbackResource", NAPI_AUTO_LENGTH, &resource_name);
    
    napi_status status = napi_create_threadsafe_function(
        env,
        args[0],
        nullptr,
        resource_name,
        0,
        1,
        nullptr,
        nullptr,
        nullptr,
        CallJSCallback,
        &g_ts_fn
    );
    
    if (status != napi_ok) {
        napi_throw_error(env, nullptr, "Failed to create threadsafe function");
        return nullptr;
    }
    
    g_engine = [[SpeechRecognizerEngine alloc] initWithCallback:g_ts_fn];
    
    // Instantly publish discovered devices on init
    [g_engine publishAudioDevices];
    
    return nullptr;
}

napi_value Start(napi_env env, napi_callback_info info) {
    size_t argc = 3;
    napi_value args[3] = {nullptr};
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    
    char locale_buf[64] = "en-US";
    size_t locale_len = 0;
    if (argc > 0) {
        napi_get_value_string_utf8(env, args[0], locale_buf, sizeof(locale_buf), &locale_len);
    }
    
    char device_buf[256] = "Default";
    size_t device_len = 0;
    if (argc > 1) {
        napi_get_value_string_utf8(env, args[1], device_buf, sizeof(device_buf), &device_len);
    }
    
    double silence_duration = 1.5;
    if (argc > 2) {
        napi_get_value_double(env, args[2], &silence_duration);
    }
    
    if (g_engine) {
        NSString* loc = [NSString stringWithUTF8String:locale_buf];
        NSString* dev = [NSString stringWithUTF8String:device_buf];
        [g_engine startRecordingWithLocale:loc deviceUID:dev silenceDuration:silence_duration];
    }
    return nullptr;
}

napi_value Stop(napi_env env, napi_callback_info info) {
    if (g_engine) {
        [g_engine stopRecording];
    }
    return nullptr;
}

napi_value SetLocale(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1] = {nullptr};
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    
    char locale_buf[64] = "en-US";
    size_t locale_len = 0;
    if (argc > 0) {
        napi_get_value_string_utf8(env, args[0], locale_buf, sizeof(locale_buf), &locale_len);
    }
    
    if (g_engine) {
        [g_engine setLocale:[NSString stringWithUTF8String:locale_buf]];
    }
    return nullptr;
}

napi_value SetAudioDevice(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1] = {nullptr};
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    
    char device_buf[256] = "Default";
    size_t device_len = 0;
    if (argc > 0) {
        napi_get_value_string_utf8(env, args[0], device_buf, sizeof(device_buf), &device_len);
    }
    
    if (g_engine) {
        [g_engine setAudioDevice:[NSString stringWithUTF8String:device_buf]];
    }
    return nullptr;
}

napi_value SetSilenceDuration(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1] = {nullptr};
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    
    double silence_duration = 1.5;
    if (argc > 0) {
        napi_get_value_double(env, args[0], &silence_duration);
    }
    
    if (g_engine) {
        [g_engine setSilenceDuration:silence_duration];
    }
    return nullptr;
}

napi_value Reset(napi_env env, napi_callback_info info) {
    if (g_engine) {
        [g_engine resetTranscription];
    }
    return nullptr;
}

napi_value RefreshDevices(napi_env env, napi_callback_info info) {
    if (g_engine) {
        [g_engine publishAudioDevices];
    }
    return nullptr;
}

napi_value Init(napi_env env, napi_value exports) {
    napi_property_descriptor desc[] = {
        { "initRecognizer", nullptr, InitRecognizer, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "start", nullptr, Start, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "stop", nullptr, Stop, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "setLocale", nullptr, SetLocale, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "setAudioDevice", nullptr, SetAudioDevice, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "setSilenceDuration", nullptr, SetSilenceDuration, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "reset", nullptr, Reset, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "refreshDevices", nullptr, RefreshDevices, nullptr, nullptr, nullptr, napi_default, nullptr }
    };
    napi_define_properties(env, exports, sizeof(desc) / sizeof(desc[0]), desc);
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
