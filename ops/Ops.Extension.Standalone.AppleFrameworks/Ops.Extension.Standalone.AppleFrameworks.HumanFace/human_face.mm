#include <node_api.h>
#import <Vision/Vision.h>
#import <CoreVideo/CoreVideo.h>
#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>
#include <vector>
#include <string>
#include <unordered_map>
#include <iostream>

struct FaceBox {
    float x;
    float y;
    float w;
    float h;
};

struct LandmarkPoint {
    float x;
    float y;
};

struct FaceResult {
    float confidence;
    FaceBox boundingBox;
    float roll;
    float yaw;
    float pitch;
    std::unordered_map<std::string, std::vector<LandmarkPoint>> landmarks;
};

struct HumanFaceData {
    napi_async_work work;
    napi_deferred deferred;
    
    // Inputs
    std::vector<uint8_t> input_pixels;
    int width;
    int height;
    
    // Outputs
    std::vector<FaceResult> faces;
    std::string error;
};

// Vision face detection logic running on a background thread pool thread
void run_human_face(HumanFaceData* data) {
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
        
        // 2. Perform Apple Vision Face Landmarks Detection
        VNDetectFaceLandmarksRequest* request = [[VNDetectFaceLandmarksRequest alloc] init];
        VNImageRequestHandler* handler = [[VNImageRequestHandler alloc] initWithCVPixelBuffer:pixelBuffer options:@{}];
        NSError* error = nil;
        BOOL success = [handler performRequests:@[request] error:&error];
        CFRelease(pixelBuffer);
        
        if (!success || error) {
            data->error = error ? [error.localizedDescription UTF8String] : "Face tracking request failed";
            return;
        }
        
        // 3. Process results
        NSArray<VNFaceObservation*>* results = request.results;
        if (!results) return;
        
        for (VNFaceObservation* observation in results) {
            FaceResult resFace;
            resFace.confidence = observation.confidence;
            
            CGRect box = observation.boundingBox;
            resFace.boundingBox.x = box.origin.x;
            resFace.boundingBox.y = 1.0 - (box.origin.y + box.size.height); // Standard top-left origin
            resFace.boundingBox.w = box.size.width;
            resFace.boundingBox.h = box.size.height;
            
            resFace.roll = observation.roll ? observation.roll.floatValue : 0.0;
            resFace.yaw = observation.yaw ? observation.yaw.floatValue : 0.0;
            resFace.pitch = observation.pitch ? observation.pitch.floatValue : 0.0;
            
            VNFaceLandmarks2D* landmarks = observation.landmarks;
            if (landmarks) {
                // Map regions
                NSDictionary<NSString*, VNFaceLandmarkRegion2D*>* regions = @{
                    @"faceContour": landmarks.faceContour,
                    @"leftEye": landmarks.leftEye,
                    @"rightEye": landmarks.rightEye,
                    @"leftEyebrow": landmarks.leftEyebrow,
                    @"rightEyebrow": landmarks.rightEyebrow,
                    @"nose": landmarks.nose,
                    @"noseCrest": landmarks.noseCrest,
                    @"medianLine": landmarks.medianLine,
                    @"outerLips": landmarks.outerLips,
                    @"innerLips": landmarks.innerLips,
                    @"leftPupil": landmarks.leftPupil,
                    @"rightPupil": landmarks.rightPupil
                };
                
                for (NSString* name in regions) {
                    VNFaceLandmarkRegion2D* region = regions[name];
                    if (!region) continue;
                    
                    std::vector<LandmarkPoint> pts;
                    const CGPoint* points = region.normalizedPoints;
                    size_t pointCount = region.pointCount;
                    
                    for (size_t p = 0; p < pointCount; ++p) {
                        CGPoint pt = points[p];
                        LandmarkPoint resPt;
                        resPt.x = box.origin.x + pt.x * box.size.width;
                        resPt.y = 1.0 - (box.origin.y + pt.y * box.size.height);
                        pts.push_back(resPt);
                    }
                    resFace.landmarks[[name UTF8String]] = pts;
                }
            }
            
            data->faces.push_back(resFace);
        }
    }
}

// Background thread execute function
void ExecuteHumanFace(napi_env env, void* data) {
    HumanFaceData* d = static_cast<HumanFaceData*>(data);
    run_human_face(d);
}

// JS main thread complete function
void CompleteHumanFace(napi_env env, napi_status status, void* data) {
    HumanFaceData* d = static_cast<HumanFaceData*>(data);
    
    if (!d->error.empty()) {
        napi_value error_msg = nullptr;
        napi_create_string_utf8(env, d->error.c_str(), NAPI_AUTO_LENGTH, &error_msg);
        napi_value error = nullptr;
        napi_create_error(env, nullptr, error_msg, &error);
        napi_reject_deferred(env, d->deferred, error);
    } else {
        // Create the main faces array
        napi_value faces_array = nullptr;
        napi_create_array_with_length(env, d->faces.size(), &faces_array);
        
        for (size_t i = 0; i < d->faces.size(); ++i) {
            const auto& srcFace = d->faces[i];
            napi_value face_obj = nullptr;
            napi_create_object(env, &face_obj);
            
            // confidence
            napi_value conf_val = nullptr;
            napi_create_double(env, srcFace.confidence, &conf_val);
            napi_set_named_property(env, face_obj, "confidence", conf_val);
            
            // boundingBox { x, y, w, h }
            napi_value box_obj = nullptr;
            napi_create_object(env, &box_obj);
            
            napi_value val_x = nullptr; napi_create_double(env, srcFace.boundingBox.x, &val_x);
            napi_set_named_property(env, box_obj, "x", val_x);
            napi_value val_y = nullptr; napi_create_double(env, srcFace.boundingBox.y, &val_y);
            napi_set_named_property(env, box_obj, "y", val_y);
            napi_value val_w = nullptr; napi_create_double(env, srcFace.boundingBox.w, &val_w);
            napi_set_named_property(env, box_obj, "w", val_w);
            napi_value val_h = nullptr; napi_create_double(env, srcFace.boundingBox.h, &val_h);
            napi_set_named_property(env, box_obj, "h", val_h);
            
            napi_set_named_property(env, face_obj, "boundingBox", box_obj);
            
            // roll, yaw, pitch
            napi_value roll_val = nullptr; napi_create_double(env, srcFace.roll, &roll_val);
            napi_set_named_property(env, face_obj, "roll", roll_val);
            napi_value yaw_val = nullptr; napi_create_double(env, srcFace.yaw, &yaw_val);
            napi_set_named_property(env, face_obj, "yaw", yaw_val);
            napi_value pitch_val = nullptr; napi_create_double(env, srcFace.pitch, &pitch_val);
            napi_set_named_property(env, face_obj, "pitch", pitch_val);
            
            // landmarks mapping
            napi_value landmarks_obj = nullptr;
            napi_create_object(env, &landmarks_obj);
            
            for (const auto& entry : srcFace.landmarks) {
                const std::string& landmarkName = entry.first;
                const auto& pts = entry.second;
                
                napi_value pts_arr = nullptr;
                napi_create_array_with_length(env, pts.size(), &pts_arr);
                
                for (size_t p = 0; p < pts.size(); ++p) {
                    napi_value pt_obj = nullptr;
                    napi_create_object(env, &pt_obj);
                    
                    napi_value px_val = nullptr; napi_create_double(env, pts[p].x, &px_val);
                    napi_set_named_property(env, pt_obj, "x", px_val);
                    napi_value py_val = nullptr; napi_create_double(env, pts[p].y, &py_val);
                    napi_set_named_property(env, pt_obj, "y", py_val);
                    
                    napi_set_element(env, pts_arr, p, pt_obj);
                }
                
                napi_set_named_property(env, landmarks_obj, landmarkName.c_str(), pts_arr);
            }
            
            napi_set_named_property(env, face_obj, "landmarks", landmarks_obj);
            napi_set_element(env, faces_array, i, face_obj);
        }
        
        napi_resolve_deferred(env, d->deferred, faces_array);
    }
    
    napi_delete_async_work(env, d->work);
    delete d;
}

// Exports: track(buffer, width, height) -> Promise<FacesArray>
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
    
    HumanFaceData* d = new HumanFaceData();
    d->width = width;
    d->height = height;
    d->input_pixels.assign((uint8_t*)buffer_ptr, (uint8_t*)buffer_ptr + buffer_len);
    
    napi_value promise = nullptr;
    napi_create_promise(env, &d->deferred, &promise);
    
    napi_value resource_name = nullptr;
    napi_create_string_utf8(env, "HumanFaceTrackerWorker", NAPI_AUTO_LENGTH, &resource_name);
    
    napi_create_async_work(
        env,
        nullptr,
        resource_name,
        ExecuteHumanFace,
        CompleteHumanFace,
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
