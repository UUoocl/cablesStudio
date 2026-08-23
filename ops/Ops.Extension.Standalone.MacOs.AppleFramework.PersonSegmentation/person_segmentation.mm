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
        
        // 2. Perform Apple Vision Segmentation
        VNGeneratePersonSegmentationRequest* request = [[VNGeneratePersonSegmentationRequest alloc] init];
        if (data->quality == "accurate") {
            request.qualityLevel = VNGeneratePersonSegmentationRequestQualityLevelAccurate;
        } else if (data->quality == "fast") {
            request.qualityLevel = VNGeneratePersonSegmentationRequestQualityLevelFast;
        } else {
            request.qualityLevel = VNGeneratePersonSegmentationRequestQualityLevelBalanced;
        }
        request.outputPixelFormat = kCVPixelFormatType_OneComponent8;
        
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
        if (!result) {
            data->error = "No segmentation mask returned";
            return;
        }
        
        CVPixelBufferRef maskPixelBuffer = result.pixelBuffer;
        CVPixelBufferLockBaseAddress(maskPixelBuffer, kCVPixelBufferLock_ReadOnly);
        
        int maskWidth = (int)CVPixelBufferGetWidth(maskPixelBuffer);
        int maskHeight = (int)CVPixelBufferGetHeight(maskPixelBuffer);
        size_t maskBytesPerRow = CVPixelBufferGetBytesPerRow(maskPixelBuffer);
        uint8_t* maskBase = (uint8_t*)CVPixelBufferGetBaseAddress(maskPixelBuffer);
        
        data->mask_width = maskWidth;
        data->mask_height = maskHeight;
        data->output_mask.resize(maskWidth * maskHeight * 4);
        uint8_t* outPtr = data->output_mask.data();
        
        for (int y = 0; y < maskHeight; ++y) {
            uint8_t* rowPtr = maskBase + (y * maskBytesPerRow);
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
    
    if (!d->error.empty()) {
        napi_value error_msg = nullptr;
        napi_create_string_utf8(env, d->error.c_str(), NAPI_AUTO_LENGTH, &error_msg);
        napi_value error = nullptr;
        napi_create_error(env, nullptr, error_msg, &error);
        napi_reject_deferred(env, d->deferred, error);
    } else {
        napi_value res_obj = nullptr;
        napi_create_object(env, &res_obj);
        
        napi_value mask_buf = nullptr;
        void* buffer_data = nullptr;
        napi_create_buffer_copy(env, d->output_mask.size(), d->output_mask.data(), &buffer_data, &mask_buf);
        napi_set_named_property(env, res_obj, "mask", mask_buf);
        
        napi_value width_val = nullptr;
        napi_create_int32(env, d->mask_width, &width_val);
        napi_set_named_property(env, res_obj, "width", width_val);
        
        napi_value height_val = nullptr;
        napi_create_int32(env, d->mask_height, &height_val);
        napi_set_named_property(env, res_obj, "height", height_val);
        
        napi_resolve_deferred(env, d->deferred, res_obj);
    }
    
    napi_delete_async_work(env, d->work);
    delete d;
}

// Exports: segment(buffer, width, height, quality) -> Promise
napi_value Segment(napi_env env, napi_callback_info info) {
    size_t argc = 4;
    napi_value args[4] = {nullptr};
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    
    if (argc < 4) {
        napi_throw_type_error(env, nullptr, "Buffer, width, height and quality arguments required");
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
    
    char quality_buf[32] = {0};
    size_t copied = 0;
    napi_get_value_string_utf8(env, args[3], quality_buf, sizeof(quality_buf), &copied);
    
    SegmentationData* d = new SegmentationData();
    d->width = width;
    d->height = height;
    d->quality = quality_buf;
    d->input_pixels.assign((uint8_t*)buffer_ptr, (uint8_t*)buffer_ptr + buffer_len);
    
    napi_value promise = nullptr;
    napi_create_promise(env, &d->deferred, &promise);
    
    napi_value resource_name = nullptr;
    napi_create_string_utf8(env, "PersonSegmentationWorker", NAPI_AUTO_LENGTH, &resource_name);
    
    napi_create_async_work(
        env,
        nullptr,
        resource_name,
        ExecuteSegmentation,
        CompleteSegmentation,
        d,
        &d->work
    );
    
    napi_queue_async_work(env, d->work);
    
    return promise;
}

napi_value Init(napi_env env, napi_value exports) {
    napi_property_descriptor desc[] = {
        { "segment", nullptr, Segment, nullptr, nullptr, nullptr, napi_default, nullptr }
    };
    napi_define_properties(env, exports, sizeof(desc) / sizeof(desc[0]), desc);
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
