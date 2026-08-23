#import <Cocoa/Cocoa.h>
#import <IOKit/hid/IOHIDManager.h>
#include <thread>
#include <algorithm>

int main() {
    @autoreleasepool {
        // Create 72x72 solid blue JPEG
        NSBitmapImageRep *rep = [[NSBitmapImageRep alloc] initWithBitmapDataPlanes:NULL
                                                                        pixelsWide:72
                                                                        pixelsHigh:72
                                                                     bitsPerSample:8
                                                                   samplesPerPixel:4
                                                                          hasAlpha:YES
                                                                          isPlanar:NO
                                                                    colorSpaceName:NSCalibratedRGBColorSpace
                                                                       bytesPerRow:72*4
                                                                      bitsPerPixel:32];
        uint8_t *bitmap = [rep bitmapData];
        for (int i = 0; i < 72*72; i++) {
            bitmap[i*4 + 0] = 0;   // R
            bitmap[i*4 + 1] = 128; // G
            bitmap[i*4 + 2] = 255; // B
            bitmap[i*4 + 3] = 255; // A
        }
        
        NSDictionary *props = @{ NSImageCompressionFactor: @(0.9) };
        NSData *jpeg = [rep representationUsingType:NSBitmapImageFileTypeJPEG properties:props];
        NSLog(@"Generated JPEG size: %lu bytes", jpeg.length);
        
        std::thread t([jpeg]() {
            @autoreleasepool {
                IOHIDManagerRef manager = IOHIDManagerCreate(kCFAllocatorDefault, kIOHIDOptionsTypeNone);
                NSDictionary *match = @{ @kIOHIDVendorIDKey: @(0x0FD9) };
                IOHIDManagerSetDeviceMatching(manager, (__bridge CFDictionaryRef)match);
                
                CFSetRef deviceSet = IOHIDManagerCopyDevices(manager);
                if (deviceSet && CFSetGetCount(deviceSet) > 0) {
                    CFIndex count = CFSetGetCount(deviceSet);
                    CFTypeRef values[16];
                    CFSetGetValues(deviceSet, values);
                    IOHIDDeviceRef dev = (IOHIDDeviceRef)values[0];
                    
                    IOReturn ret = IOHIDDeviceOpen(dev, kIOHIDOptionsTypeNone);
                    NSLog(@"IOHIDDeviceOpen: %d", ret);
                    
                    if (ret == kIOReturnSuccess) {
                        const uint8_t *bytes = (const uint8_t*)jpeg.bytes;
                        size_t totalLen = jpeg.length;
                        size_t maxPayload = 1016;
                        size_t offset = 0;
                        uint16_t page = 0;
                        
                        while (offset < totalLen) {
                            size_t chunkLen = std::min(maxPayload, totalLen - offset);
                            uint8_t isLast = (offset + chunkLen >= totalLen) ? 1 : 0;
                            
                            uint8_t packet[1024] = {0};
                            packet[0] = 0x07; // Command: Set Key Image
                            packet[1] = 0;    // Key 0
                            packet[2] = isLast;
                            packet[3] = chunkLen & 0xFF;
                            packet[4] = (chunkLen >> 8) & 0xFF;
                            packet[5] = page & 0xFF;
                            packet[6] = (page >> 8) & 0xFF;
                            packet[7] = 0x00;
                            
                            memcpy(packet + 8, bytes + offset, chunkLen);
                            
                            IOReturn rOut = IOHIDDeviceSetReport(dev, kIOHIDReportTypeOutput, 0x02, packet, 1024);
                            NSLog(@"Chunk %u (len %zu, isLast %u) Output report ret: 0x%08X", page, chunkLen, isLast, rOut);
                            if (rOut != kIOReturnSuccess) {
                                IOReturn rFeat = IOHIDDeviceSetReport(dev, kIOHIDReportTypeFeature, 0x02, packet, 1024);
                                NSLog(@"Chunk %u Feature report ret: 0x%08X", page, rFeat);
                            }
                            
                            offset += chunkLen;
                            page++;
                        }
                        
                        IOHIDDeviceClose(dev, kIOHIDOptionsTypeNone);
                    }
                    CFRelease(deviceSet);
                }
                CFRelease(manager);
            }
        });
        
        t.join();
    }
    return 0;
}
