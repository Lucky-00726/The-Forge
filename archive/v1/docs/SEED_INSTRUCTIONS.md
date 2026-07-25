# HOW TO SEED 70 MISSIONS

The 70-mission seed file is too large to generate in one go. Here are your options:

## OPTION 1: Manual Seed via CSV Import (Recommended)

I can generate a CSV file that you can import via Supabase Dashboard:

1. I'll create: `missions_seed.csv`
2. You upload it: Supabase Dashboard → Table Editor → missions → Import CSV
3. Done in 30 seconds

**Want me to generate the CSV file?**

---

## OPTION 2: Generate SQL in Chunks

I'll create 7 SQL files (one per day per week):
- `week1_day1.sql`
- `week1_day2.sql`
- ... etc

You run each file sequentially in SQL Editor.

---

## OPTION 3: Use the Original 14 Missions

The `COMPLETE_SCHEMA.sql` already has 14 working missions (Week 1 + Week 2 sample).

Run just that section to get started immediately while we figure out the best way to load all 70.

---

## RECOMMENDED: CSV Import

CSV import is fastest and least error-prone. 

**Should I generate the CSV file now?**

Format will be:
```
id,title,category,mission_type,week_number,unlock_day,xp_reward,subtype,source_type,content
W1D1-COM,"Group Project Conflict","Communication","Poll + Reasoning",1,1,50,scenario,SSB,"{...}"
...
```

Let me know which option you prefer.
