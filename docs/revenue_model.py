#!/usr/bin/env python3
"""
Choo Choo Pop / هو هو چی چی - first-year IAP + revenue scenario model.

These are SCENARIOS built from stated assumptions, not measurements. Change the numbers in
ASSUMPTIONS and run:  python3 docs/revenue_model.py
Part 2 (levels 21+) is assumed to ship at the start of month PART2_MONTH.
"""
import json

PART2_MONTH = 4          # first month in which "Part 2 unlock" can be sold
MONTHS = 12

# product mix (share of purchases) once Part 2 is live / before it exists
PRICES_EN = {"part2": 2.99, "hints_s": 0.99, "hints_l": 2.49, "skins": 1.99, "bundle": 4.99}
MIX_B = {"part2": .35, "hints_s": .25, "hints_l": .10, "skins": .15, "bundle": .15}   # Part 2 live
MIX_A = {"hints_s": .50, "hints_l": .20, "skins": .30}                                 # Part 1 only
# Persian edition: same products, USD-equivalent prices (set the Toman tiers at launch)
PRICES_FA = {k: round(v * 0.38, 2) for k, v in PRICES_EN.items()}

ASSUMPTIONS = {
    # installs in month 1, monthly growth, payer conversion (% of a month's installs that ever buy,
    # Part 2 live), purchases per payer in 12 months, store fee, catch-up buyers at Part 2 launch,
    # rewarded-ad impressions per install and eCPM (Persian edition only)
    "EN": {
        "prices": PRICES_EN, "fee": 0.15,
        "pess": dict(m1=250,   g=0.03, conv=0.004, ppp=1.15, catch=0.002, ads_imp=0, ecpm=0),
        "base": dict(m1=1200,  g=0.08, conv=0.010, ppp=1.35, catch=0.005, ads_imp=0, ecpm=0),
        "opt":  dict(m1=4000,  g=0.12, conv=0.018, ppp=1.60, catch=0.008, ads_imp=0, ecpm=0),
    },
    "FA": {
        "prices": PRICES_FA, "fee": 0.20,
        "pess": dict(m1=1500,  g=0.03, conv=0.0025, ppp=1.10, catch=0.001, ads_imp=3,  ecpm=0.5),
        "base": dict(m1=6000,  g=0.08, conv=0.006,  ppp=1.25, catch=0.003, ads_imp=8,  ecpm=0.8),
        "opt":  dict(m1=20000, g=0.12, conv=0.012,  ppp=1.45, catch=0.005, ads_imp=12, ecpm=1.2),
    },
}
PHASE_A_CONV_FACTOR = 0.4   # before Part 2 exists only hints/skins are for sale

def avg_price(prices, mix):
    return sum(prices[k] * s for k, s in mix.items())

def run(ed, sc):
    A = ASSUMPTIONS[ed]; p = A[sc]; prices = A["prices"]
    installs_total = 0; purchases = {k: 0.0 for k in prices}; gross_iap = 0.0
    for m in range(1, MONTHS + 1):
        inst = p["m1"] * (1 + p["g"]) ** (m - 1)
        installs_total += inst
        live = m >= PART2_MONTH
        mix = MIX_B if live else MIX_A
        conv = p["conv"] * (1 if live else PHASE_A_CONV_FACTOR)
        n_purch = inst * conv * p["ppp"]
        for k, s in mix.items():
            purchases[k] += n_purch * s
            gross_iap += n_purch * s * prices[k]
        if m == PART2_MONTH:   # players who finished Part 1 earlier come back for Part 2
            base_installs = sum(p["m1"] * (1 + p["g"]) ** (i - 1) for i in range(1, PART2_MONTH))
            n = base_installs * p["catch"]
            purchases["part2"] += n; gross_iap += n * prices["part2"]
    ads = installs_total * p["ads_imp"] / 1000 * p["ecpm"]
    gross = gross_iap + ads
    return dict(installs=round(installs_total), purchases={k: round(v) for k, v in purchases.items()},
                total_purchases=round(sum(purchases.values())), gross_iap=round(gross_iap), ads=round(ads),
                gross=round(gross), net=round(gross * (1 - A["fee"])),
                arpu=round(gross / installs_total, 3))

if __name__ == "__main__":
    out = {ed: {sc: run(ed, sc) for sc in ("pess", "base", "opt")} for ed in ASSUMPTIONS}
    for sc in ("pess", "base", "opt"):
        out.setdefault("TOTAL", {})[sc] = dict(
            installs=out["EN"][sc]["installs"] + out["FA"][sc]["installs"],
            gross=out["EN"][sc]["gross"] + out["FA"][sc]["gross"],
            net=out["EN"][sc]["net"] + out["FA"][sc]["net"])
    print(json.dumps(out, indent=1))
    print("avg price/purchase EN  Part1-only: %.2f  Part2-live: %.2f" % (avg_price(PRICES_EN, MIX_A), avg_price(PRICES_EN, MIX_B)))
