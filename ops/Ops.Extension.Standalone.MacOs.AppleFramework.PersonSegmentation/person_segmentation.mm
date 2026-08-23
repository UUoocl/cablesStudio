#include <node_api.h>
#import <Vision/Vision.h>
#import <CoreVideo/CoreVideo.h>
#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>
#include <vector>
#include <string>
#include <iostream>

struct SegmentationData {
    napi_async_work work;
    napi_deferred deferred;
    
    // Input parameters
    std::vector<uint8_t> input_pixels;
    int width;
    int height;
    std::string quality;
    
    // Output parameters
    std::vector<uint8_t> output_mask;
    int mask_width;
    int mask_height;
    std::string error;
};

// Vision processing running on a background thread pool thread
void run_segmentation(SegmentationData* data) {
    @autoreleasepool {
        int width = data->width;
        int height = data->height;
        
        if (width <= 0 || height <= 0 || data->input_pixels.size() < (size_t)(width * height * 4)) {
            data->error = "Invalid texture dimensions or buffer size";
            return;
        }
        
        // 1. Create CVPixelBuffer from raw RGBA input with IOSurface and Metal backing
        CVPixelBufferRef pixelBuffer = NULL;
        NSDictionary* attrs = @{
            (id)kCVPixelBufferMetalCompatibilityKey: @YES,
            (id)kCVPixelBufferCGImageCompatibilityKey: @YES,
            (id)kCVPixelBufferCGBitmapContextCompatibilityKey: @YES,
            (id)kCVPixelBufferIOSurfacePropertiesKey: @{}
        };
        
        CVReturn status = CVPixelBufferCreate(
            kCFAllocatorDefault,
            width,
            height,
            kCVPixelFormatType_32BGRA,
            (__bridge CFDictionaryRef)attrs,
            &pixelBuffer
        );
        
        if (status != kCVReturnSuccess || !pixelBuffer) {
            data->error = "Failed to create input CVPixelBuffer";
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
        
        // 2. Perform Apple Vision Segmentation
        VNGeneratePersonSegmentationRequest* request = [[VNGeneratePersonSegmentationRequest alloc] init];
        if (data->quality == "accurate") {
            request.qualityLevel = VNGeneratePersonSegmentationRequestQualityLevelAccurate;
        } else if (data->quality == "fast") {
            request.qualityLevel = VNGeneratePersonSegmentationRequestQualityLevelFast;
        } else {
            request.qualityLevel = VNGeneratePersonSegmentationRequestQualityLevelBalanced;
        }
        
        VNImageRequestHandler* handler = [[VNImageRequestHandler alloc] initWithCVPixelBuffer:pixelBuffer options:@{}];
        NSError* error = nil;
        BOOL success = [handler performRequests:@[request] error:&error];
        CFRelease(pixelBuffer);
        
        if (!success || error) {
            data->error = error ? [error.localizedDescription UTF8String] : "Vision request failed";
            return;
        }
        
        // 3. Retrieve segmentation mask
        VNPixelBufferObservation* result = request.results.firstObject;
        if (!result || !result.pixelBuffer) {
            data->error = "No segmentation mask returned";
            return;
        }
        
        CVPixelBufferRef maskPixelBuffer = result.pixelBuffer;
        CVPixelBufferLockBaseAddress(maskPixelBuffer, kCVPixelBufferLock_ReadOnly);
        
        int maskWidth = (int)CVPixelBufferGetWidth(maskPixelBuffer);
        int maskHeight = (int)CVPixelBufferGetHeight(maskPixelBuffer);
        OSType maskFormat = CVPixelBufferGetPixelFormatType(maskPixelBuffer);
        size_t maskBytesPerRow = CVPixelBufferGetBytesPerRow(maskPixelBuffer);
        uint8_t* maskBase = (uint8_t*)CVPixelBufferGetBaseAddress(maskPixelBuffer);
        
        data->mask_width = maskWidth;
        data->mask_height = maskHeight;
        data->output_mask.resize(maskWidth * maskHeight * 4);
        uint8_t* outPtr = data->output_mask.data();
        
        // Support both Float32 ('L00f') and UInt8 ('L008') pixel buffer formats
        if (maskFormat == kCVPixelFormatType_OneComponent32Float || maskFormat == 'L00f' || maskFormat == 0x4c303066) {
            for (int y = 0; y < maskHeight; ++y) {
                const float* rowPtr = (const float*)(maskBase + (y * maskBytesPerRow));
                uint8_t* dstRow = outPtr + (y * maskWidth * 4);
                for (int x = 0; x < maskWidth; ++x) {
                    float fVal = rowPtr[x];
                    if (fVal < 0.0f) fVal = 0.0f;
                    else if (fVal > 1.0f) fVal = 1.0f;
                    uint8_t val = (uint8_t)(fVal * 255.0f);
                    int idx = x * 4;
                    dstRow[idx] = val;
                    dstRow[idx + 1] = val;
                    dstRow[idx + 2] = val;
                    dstRow[idx + 3] = 255;
                }
            }
        } else {
            for (int y = 0; y < maskHeight; ++y) {
                const uint8_t* rowPtr = maskBase + (y * maskBytesPerRow);
                uint8_t* dstRow = outPtr + (y * maskWidth * 4);
                for (int x = 0; x < maskWidth; ++x) {
                    uint8_t val = rowPtr[x];
                    int idx = x * 4;
                    dstRow[idx] = val;
                    dstRow[idx + 1] = val;
                    dstRow[idx + 2] = val;
                    dstRow[idx + 3] = 255;
                }
            }
        }
        CVPixelBufferUnlockBaseAddress(maskPixelBuffer, kCVPixelBufferLock_ReadOnly);
    }
}

// Background thread execute function
void ExecuteSegmentation(napi_env env, void* data) {
    SegmentationData* d = static_cast<SegmentationData*>(data);
    run_segmentation(d);
}

// JS main thread complete function
void CompleteSegmentation(napi_env env, napi_status status, void* data) {
    SegmentationData* d = static_cast<SegmentationData*>(data);
    
    if (status != napi_ok || !d->error.empty()) {
        napi_value error_msg;
        std::string errStr = d->error.empty() ? "Async worker failed" : d->error;
        napi_create_string_utf8(env, errStr.c_str(), NAPI_AUTO_LENGTH, &error_msg);
        napi_reject_deferred(env, d->deferred, error_msg);
    } else {
        napi_value result_obj;
        napi_create_object(env, &result_obj);
        
        napi_value width_val, height_val;
        napi_create_int32(env, d->mask_width, &width_val);
        napi_create_int32(env, d->mask_height, &height_val);
        napi_set_named_property(env, result_obj, "width", width_val);
        napi_set_named_property(env, result_obj, "height", height_val);
        
        // Create JS Buffer for output mask
        napi_value mask_buffer;
        void* buffer_data = nullptr;
        size_t buffer_length = d->output_mask.size();
        napi_create_buffer(env, buffer_length, &buffer_data, &mask_buffer);
        if (buffer_data && buffer_length > 0) {
            memcpy(buffer_data, d->output_mask.data(), buffer_length);
        }
        napi_set_named_property(env, result_obj, "mask", mask_buffer);
        
        napi_resolve_deferred(env, d->deferred, result_obj);
    }
    
    napi_delete_async_work(env, d->work);
    delete d;
}

// Entrypoint: segment(buffer, width, height, quality) -> Promise
napi_value Segment(napi_env env, napi_callback_info info) {
    size_t argc = 4;
    napi_value args[4];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    
    if (argc < 3) {
        napi_throw_type_error(env, nullptr, "Expected buffer, width, height, [quality]");
        return nullptr;
    }
    
    // 1. Extract Buffer
    bool is_buffer = false;
    napi_is_buffer(env, args[0], &is_buffer);
    if (!is_buffer) {
        napi_throw_type_error(env, nullptr, "First argument must be a Buffer");
        return nullptr;
    }
    
    uint8_t* buffer_data = nullptr;
    size_t buffer_length = 0;
    napi_get_buffer_info(env, args[0], (void**)&buffer_data, &buffer_length);
    
    // 2. Extract dimensions
    int32_t width = 0, height = 0;
    napi_get_value_int32(env, args[1], &width);
    napi_get_value_int32(env, args[2], &height);
    
    if (width <= 0 || height <= 0) {
        napi_throw_range_error(env, nullptr, "Width and height must be positive non-zero integers");
        return nullptr;
    }
    
    // 3. Extract quality
    std::string quality = "balanced";
    if (argc >= 4) {
        size_t str_len = 0;
        napi_get_value_string_utf8(env, args[3], nullptr, 0, &str_len);
        if (str_len > 0) {
            quality.resize(str_len);
            napi_get_value_string_utf8(env, args[3], &quality[0], str_len + 1, &str_len);
        }
    }
    
    // Create async data
    SegmentationData* data = new SegmentationData();
    data->width = width;
    data->height = height;
    data->quality = quality;
    data->input_pixels.assign(buffer_data, buffer_data + (width * height * 4));
    
    napi_value promise;
    napi_create_promise(env, &data->deferred, &promise);
    
    napi_value resource_name;
    napi_create_string_utf8(env, "PersonSegmentationWorker", NAPI_AUTO_LENGTH, &resource_name);
    
    napi_create_async_work(
        env,
        nullptr,
        resource_name,
        ExecuteSegmentation,
        CompleteSegmentation,
        data,
        &data->work
    );
    
    napi_queue_async_work(env, data->work);
    
    return promise;
}

napi_value Init(napi_env env, napi_value exports) {
    napi_value fn;
    napi_create_function(env, "segment", NAPI_AUTO_LENGTH, Segment, nullptr, &fn);
    napi_set_named_property(env, exports, "segment", fn);
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
