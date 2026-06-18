//
//  StreamDeckProduct.swift
//  Codedeck
//
//  Created by Sherlock, James on 26/11/2018.
//  Copyright © 2018 Sherlouk. All rights reserved.
//

import Foundation

#if canImport(HIDSwift)
import HIDSwift
#endif

public enum StreamDeckProduct: CaseIterable {
    
    case streamDeck       // 0x0060 (Original V1)
    case streamDeckV2     // 0x006d (V2)
    case streamDeckMk2    // 0x0080 (Mk2)
    case streamDeckMini   // 0x0063 (Mini V1)
    case streamDeckMiniV2 // 0x0090 (Mini V2)
    case streamDeckXL     // 0x006c (XL V1)
    case streamDeckXLGen2 // 0x008f (XL Gen 2)
    case streamDeckPlus   // 0x0084 (Plus)
    
    // Public
    
    public func productInformation() -> HIDDeviceMonitor.ProductInformation {
        return .init(vendorId: vendorId, productId: productId)
    }
    
    public var iconSize: Int {
        switch self {
        case .streamDeck, .streamDeckV2, .streamDeckMk2: return 72
        case .streamDeckMini, .streamDeckMiniV2: return 80
        case .streamDeckXL, .streamDeckXLGen2: return 96
        case .streamDeckPlus: return 120
        }
    }
    
    public var keyCount: Int {
        switch self {
        case .streamDeck, .streamDeckV2, .streamDeckMk2: return 15
        case .streamDeckMini, .streamDeckMiniV2: return 6
        case .streamDeckXL, .streamDeckXLGen2: return 32
        case .streamDeckPlus: return 8
        }
    }
    
    // Internal
    
    internal var vendorId: Int {
        return 0x0fd9
    }
    
    internal var productId: Int {
        switch self {
        case .streamDeck: return 0x0060
        case .streamDeckV2: return 0x006d
        case .streamDeckMk2: return 0x0080
        case .streamDeckMini: return 0x0063
        case .streamDeckMiniV2: return 0x0090
        case .streamDeckXL: return 0x006c
        case .streamDeckXLGen2: return 0x008f
        case .streamDeckPlus: return 0x0084
        }
    }
    
    internal var pagePacketSize: Int {
        switch self {
        case .streamDeck: return 8191
        default: return 1024
        }
    }
    
    internal var dataCount: Int {
        switch self {
        case .streamDeck, .streamDeckMini: return 17
        default: return 32
        }
    }
    
    internal var isVersionTwo: Bool {
        switch self {
        case .streamDeck, .streamDeckMini: return false
        default: return true
        }
    }
    
}
