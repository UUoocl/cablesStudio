#include <node_api.h>
#import <Vision/Vision.h>
#import <CoreVideo/CoreVideo.h>
#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>
#import <simd/simd.h>
#include <vector>
#include <string>
#include <unordered_map>
#include <iostream>

struct JointPoint3D {
    float x;
    float y;
    float z;
    float confidence;
};

struct PoseResult3D {
    float confidence;
    float bodyHeight;
    std::unordered_map<std::string, JointPoint3D> joints;
};

struct HumanPose3DData {
    napi_async_work work;
    napi_deferred deferred;
    
    // Inputs
    std::vector<uint8_t> input_pixels;
    int width;
    int height;
    
    // Outputs
    std::vector<PoseResult3D> poses;
    std::string error;
};

// Vision 3D body pose detection logic running on a background thread pool thread
void run_human_pose3d(HumanPose3DData* data) {
    @autoreleasepool {
        int width = data->width;
        int height = data->height;
        
        // 1. Create CVPixelBuffer from raw RGBA input
        CVPixelBufferRef pixelBuffer = NULL;
        NSDictionary* attrs = @{
            (id)kCVPixelBufferMetalCompatibilityKey: @YES,
            (id)kCVPixelBufferCGImageCompatibilityKey: @YES,
            (id)kCVPixelBufferCGBitmapContextCompatibilityKey: @YES
        };
        
        CVReturn status = CVPixelBufferCreate(
            kCFAllocatorDefault,
            width,
            height,
            kCVPixelFormatType_32BGRA, // BGRA format
            (__bridge CFDictionaryRef)attrs,
            &pixelBuffer
        );
        
        if (status != kCVReturnSuccess || !pixelBuffer) {
            data->error = "Failed to create CVPixelBuffer";
            return;
        }
        
        // Lock and copy raw bytes, converting RGBA to BGRA
        CVPixelBufferLockBaseAddress(pixelBuffer, 0);
        size_t bytesPerRow = CVPixelBufferGetBytesPerRow(pixelBuffer);
        uint8_t* dstPtr = (uint8_t*)CVPixelBufferGetBaseAddress(pixelBuffer);
        const uint8_t* srcPtr = data->input_pixels.data();
        
        for (int y = 0; y < height; ++y) {
            const uint8_t* srcRow = srcPtr + (y * width * 4);
            uint8_t* dstRow = dstPtr + (y * bytesPerRow);
            for (int x = 0; x < width; ++x) {
                int idx = x * 4;
                // RGBA to BGRA swizzle
                dstRow[idx] = srcRow[idx + 2];     // B
                dstRow[idx + 1] = srcRow[idx + 1]; // G
                dstRow[idx + 2] = srcRow[idx];     // R
                dstRow[idx + 3] = srcRow[idx + 3]; // A
            }
        }
        CVPixelBufferUnlockBaseAddress(pixelBuffer, 0);
        
        // 2. Perform Apple Vision 3D Human Body Pose Landmarks Detection
        VNDetectHumanBodyPose3DRequest* request = [[VNDetectHumanBodyPose3DRequest alloc] init];
        
        VNImageRequestHandler* handler = [[VNImageRequestHandler alloc] initWithCVPixelBuffer:pixelBuffer options:@{}];
        NSError* error = nil;
        BOOL success = [handler performRequests:@[request] error:&error];
        CFRelease(pixelBuffer);
        
        if (!success || error) {
            data->error = error ? [error.localizedDescription UTF8String] : "3D body pose tracking request failed";
            return;
        }
        
        // 3. Process results
        NSArray<VNHumanBodyPose3DObservation*>* results = request.results;
        if (!results) return;
        
        for (VNHumanBodyPose3DObservation* observation in results) {
            PoseResult3D resPose;
            resPose.confidence = observation.confidence;
            resPose.bodyHeight = observation.bodyHeight;
            
            // Query recognized points
            NSError* recognizedError = nil;
            NSDictionary<VNRecognizedPointKey, VNHumanBodyRecognizedPoint3D*>* recognizedPoints = [observation recognizedPointsForGroupKey:VNRecognizedPointGroupKeyAll error:&recognizedError];
            
            if (!recognizedError && recognizedPoints) {
                for (VNRecognizedPointKey key in recognizedPoints) {
                    VNHumanBodyRecognizedPoint3D* pt = recognizedPoints[key];
                    
                    JointPoint3D resPt;
                    simd_float4x4 position = pt.position;
                    resPt.x = position.columns[3].x;
                    resPt.y = position.columns[3].y;
                    resPt.z = position.columns[3].z;
                    resPt.confidence = 1.0f; // 3D joint confidence defaults to 1.0
                    
                    NSString* keyStr = (NSString*)key;
                    std::string cleanName = [keyStr UTF8String];
                    
                    resPose.joints[cleanName] = resPt;
                }
            }
            
            data->poses.push_back(resPose);
        }
    }
}

// Background thread execute function
void ExecuteHumanPose3D(napi_env env, void* data) {
    HumanPose3DData* d = static_cast<HumanPose3DData*>(data);
    run_human_pose3d(d);
}

// JS main thread complete function
void CompleteHumanPose3D(napi_env env, napi_status status, void* data) {
    HumanPose3DData* d = static_cast<HumanPose3DData*>(data);
    
    if (!d->error.empty()) {
        napi_value error_msg = nullptr;
        napi_create_string_utf8(env, d->error.c_str(), NAPI_AUTO_LENGTH, &error_msg);
        napi_value error = nullptr;
        napi_create_error(env, nullptr, error_msg, &error);
        napi_reject_deferred(env, d->deferred, error);
    } else {
        // Create the main poses array
        napi_value poses_array = nullptr;
        napi_create_array_with_length(env, d->poses.size(), &poses_array);
        
        for (size_t i = 0; i < d->poses.size(); ++i) {
            const auto& srcPose = d->poses[i];
            napi_value pose_obj = nullptr;
            napi_create_object(env, &pose_obj);
            
            // confidence
            napi_value conf_val = nullptr;
            napi_create_double(env, srcPose.confidence, &conf_val);
            napi_set_named_property(env, pose_obj, "confidence", conf_val);
            
            // bodyHeight
            napi_value height_val = nullptr;
            napi_create_double(env, srcPose.bodyHeight, &height_val);
            napi_set_named_property(env, pose_obj, "bodyHeight", height_val);
            
            // joints mapping
            napi_value joints_obj = nullptr;
            napi_create_object(env, &joints_obj);
            
            for (const auto& entry : srcPose.joints) {
                const std::string& jointName = entry.first;
                const auto& pt = entry.second;
                
                napi_value pt_obj = nullptr;
                napi_create_object(env, &pt_obj);
                
                napi_value px_val = nullptr; napi_create_double(env, pt.x, &px_val);
                napi_set_named_property(env, pt_obj, "x", px_val);
                napi_value py_val = nullptr; napi_create_double(env, pt.y, &py_val);
                napi_set_named_property(env, pt_obj, "y", py_val);
                napi_value pz_val = nullptr; napi_create_double(env, pt.z, &pz_val);
                napi_set_named_property(env, pt_obj, "z", pz_val);
                napi_value pconf_val = nullptr; napi_create_double(env, pt.confidence, &pconf_val);
                napi_set_named_property(env, pt_obj, "confidence", pconf_val);
                
                napi_set_named_property(env, joints_obj, jointName.c_str(), pt_obj);
            }
            
            napi_set_named_property(env, pose_obj, "joints", joints_obj);
            napi_set_element(env, poses_array, i, pose_obj);
        }
        
        napi_resolve_deferred(env, d->deferred, poses_array);
    }
    
    napi_delete_async_work(env, d->work);
    delete d;
}

// Exports: track(buffer, width, height) -> Promise<PosesArray>
napi_value Track(napi_env env, napi_callback_info info) {
    size_t argc = 3;
    napi_value args[3] = {nullptr};
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    
    if (argc < 3) {
        napi_throw_type_error(env, nullptr, "Buffer, width, and height arguments required");
        return nullptr;
    }
    
    bool is_buffer = false;
    napi_is_buffer(env, args[0], &is_buffer);
    if (!is_buffer) {
        napi_throw_type_error(env, nullptr, "First argument must be a Buffer");
        return nullptr;
    }
    
    void* buffer_ptr = nullptr;
    size_t buffer_len = 0;
    napi_get_buffer_info(env, args[0], &buffer_ptr, &buffer_len);
    
    int width = 0;
    napi_get_value_int32(env, args[1], &width);
    
    int height = 0;
    napi_get_value_int32(env, args[2], &height);
    
    HumanPose3DData* d = new HumanPose3DData();
    d->width = width;
    d->height = height;
    d->input_pixels.assign((uint8_t*)buffer_ptr, (uint8_t*)buffer_ptr + buffer_len);
    
    napi_value promise = nullptr;
    napi_create_promise(env, &d->deferred, &promise);
    
    napi_value resource_name = nullptr;
    napi_create_string_utf8(env, "HumanPose3DTrackerWorker", NAPI_AUTO_LENGTH, &resource_name);
    
    napi_create_async_work(
        env,
        nullptr,
        resource_name,
        ExecuteHumanPose3D,
        CompleteHumanPose3D,
        d,
        &d->work
    );
    
    napi_queue_async_work(env, d->work);
    
    return promise;
}

napi_value Init(napi_env env, napi_value exports) {
    napi_property_descriptor desc[] = {
        { "track", nullptr, Track, nullptr, nullptr, nullptr, napi_default, nullptr }
    };
    napi_define_properties(env, exports, sizeof(desc) / sizeof(desc[0]), desc);
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
