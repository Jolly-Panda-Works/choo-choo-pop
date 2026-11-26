package com.jollypanda.choochoopop;

import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;
import ir.metrix.analytics.MetrixAnalytics;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

@CapacitorPlugin(name = "MetrixEvents")
public class MetrixEvents extends Plugin {
    @PluginMethod
    public void event(PluginCall call) {
        String name = call.getString("name");
        if (name == null) { call.reject("Missing name"); return; }
        JSObject values = call.getObject("attributes", new JSObject());
        Map<String, Object> attributes = new HashMap<>();
        Iterator<String> keys = values.keys();
        while (keys.hasNext()) {
            String key = keys.next();
            attributes.put(key, values.opt(key));
        }
        MetrixAnalytics.newEventByName(name, attributes);
        call.resolve();
    }

    @PluginMethod
    public void revenue(PluginCall call) {
        Double amount = call.getDouble("amount");
        if (amount == null || amount <= 0) { call.reject("Invalid amount"); return; }
        MetrixAnalytics.newRevenueByName("iap_revenue", amount, ir.metrix.analytics.messaging.RevenueCurrency.IRR);
        call.resolve();
    }
}
