package com.jollypanda.choochoopop;

import android.os.Handler;
import android.os.Looper;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import ir.tapsell.sdk.Tapsell;
import ir.tapsell.sdk.TapsellAdRequestListener;
import ir.tapsell.sdk.TapsellAdRequestOptions;
import ir.tapsell.sdk.TapsellAdShowListener;
import ir.tapsell.sdk.TapsellShowOptions;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

@CapacitorPlugin(name = "Ads")
public class TapsellAdsPlugin extends Plugin {
    private final Handler main = new Handler(Looper.getMainLooper());
    private final Map<String, String> prepared = new HashMap<>();
    private boolean showing;

    @Override
    public void load() {
        Tapsell.initialize(getActivity().getApplication(), getContext().getString(R.string.tapsell_app_key));
    }

    private String zone(String placement) {
        if ("rewarded".equals(placement)) return getContext().getString(R.string.tapsell_rewarded_zone);
        if ("interstitial".equals(placement)) return getContext().getString(R.string.tapsell_interstitial_zone);
        return null;
    }

    @PluginMethod
    public void prepare(PluginCall call) {
        String placement = call.getString("placement");
        String zoneId = zone(placement);
        if (zoneId == null) {
            call.reject("Unknown ad placement.");
            return;
        }
        main.post(() -> {
            AtomicBoolean pending = new AtomicBoolean(true);
            Runnable timeout = () -> {
                if (pending.getAndSet(false)) call.reject("No ad right now. Try again later.");
            };
            main.postDelayed(timeout, 6000);
            Tapsell.requestAd(getActivity(), zoneId, new TapsellAdRequestOptions(), new TapsellAdRequestListener() {
                private void complete(String adId) {
                    main.post(() -> {
                        if (!pending.getAndSet(false)) return;
                        main.removeCallbacks(timeout);
                        if (adId == null) {
                            call.reject("No ad right now. Try again later.");
                            return;
                        }
                        prepared.put(placement, adId);
                        call.resolve();
                    });
                }

                @Override public void onAdAvailable(String adId) { complete(adId); }
                @Override public void onError(String message) { complete(null); }
            });
        });
    }

    @PluginMethod
    public void show(PluginCall call) {
        String placement = call.getString("placement");
        String zoneId = zone(placement);
        main.post(() -> {
            String adId = prepared.remove(placement);
            if (adId == null || zoneId == null || showing) {
                call.reject("No ad is ready.");
                return;
            }
            showing = true;
            Tapsell.showAd(getActivity(), zoneId, adId, new TapsellShowOptions(), new TapsellAdShowListener() {
                private boolean opened;
                private boolean rewarded;
                private boolean rewardReported;
                private boolean closed;
                private boolean finished;
                private final boolean expectsReward = "rewarded".equals(placement);
                private final Runnable closeTimeout = this::finish;

                private void finish() {
                    if (finished) return;
                    finished = true;
                    main.removeCallbacks(closeTimeout);
                    showing = false;
                    JSObject result = new JSObject();
                    result.put("shown", opened);
                    result.put("rewarded", rewarded);
                    if (rewarded) result.put("adId", adId);
                    call.resolve(result);
                }

                @Override public void onOpened() { main.post(() -> opened = true); }
                @Override public void onClosed() {
                    main.post(() -> {
                        if (closed || finished) return;
                        closed = true;
                        if (!expectsReward || rewardReported) finish();
                        // Some ads close before the SDK delivers the reward result.
                        else main.postDelayed(closeTimeout, 2000);
                    });
                }
                @Override public void onError(String message) { main.post(this::finish); }
                @Override public void onRewarded(boolean completed) {
                    main.post(() -> {
                        if (!expectsReward || finished) return;
                        rewardReported = true;
                        rewarded = rewarded || completed;
                        if (closed) finish();
                    });
                }
                @Override public void onAdClicked() {}
            });
        });
    }
}
