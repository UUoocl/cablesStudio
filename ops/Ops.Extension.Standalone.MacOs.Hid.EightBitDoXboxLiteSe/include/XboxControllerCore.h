#ifndef XBOX_CONTROLLER_CORE_H
#define XBOX_CONTROLLER_CORE_H

#import <Foundation/Foundation.h>

#define XBOX_BTN_MENU        (1 << 0)
#define XBOX_BTN_VIEW        (1 << 1)
#define XBOX_BTN_A           (1 << 2)
#define XBOX_BTN_B           (1 << 3)
#define XBOX_BTN_X           (1 << 4)
#define XBOX_BTN_Y           (1 << 5)
#define XBOX_BTN_DPAD_UP     (1 << 6)
#define XBOX_BTN_DPAD_DOWN   (1 << 7)
#define XBOX_BTN_DPAD_LEFT   (1 << 8)
#define XBOX_BTN_DPAD_RIGHT  (1 << 9)
#define XBOX_BTN_LB          (1 << 10)
#define XBOX_BTN_RB          (1 << 11)
#define XBOX_BTN_LS_CLICK    (1 << 12)
#define XBOX_BTN_RS_CLICK    (1 << 13)
#define XBOX_BTN_GUIDE       (1 << 14)
#define XBOX_BTN_SHARE       (1 << 15)

typedef struct {
    float ls_x;
    float ls_y;
    float rs_x;
    float rs_y;
    float lt;
    float rt;
    unsigned int buttons;
} XboxControllerInputState;

typedef void (*XboxControllerInputCallback)(XboxControllerInputState state, const char *jsonString, void *context);

@interface XboxControllerManager : NSObject

+ (instancetype)sharedManager;

- (BOOL)startWithCallback:(XboxControllerInputCallback)callback context:(void *)context;
- (void)stop;
- (BOOL)isDeviceConnected;
- (void)sendRumbleLeft:(float)left right:(float)right leftTrigger:(float)leftTrigger rightTrigger:(float)rightTrigger;

@end

#endif
