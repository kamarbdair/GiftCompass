# GiftCompass MVP: Competition Demo Walkthrough (about 3½ minutes)

**Before you present**
- Run `node server.js`, open http://localhost:3000, and do one dry run. Click **Start over** before going on stage.
- Zoom the browser to about 110–125%. Keep a second tab open as a backup.
- All expected results below were produced by the current version of the app.

---

### 0:00 Problem and the two methods (30 s)
> "Gift buyers spend a lot of time searching and still aren't sure the gift fits the person. GiftCompass starts with the recipient. This is our working prototype: a real web app with a back-end recommendation engine."

Point at the two cards on the welcome page:
> "There are two ways to describe the recipient. **Option A**, answering 10 questions, works today. **Option B** is a future feature, so it's clearly marked 'Coming later'. The *recipient themselves* would choose to share interests from their own social media with explicit permission. We never ask for someone else's username, and we don't scrape anything."

Point at the **"Prototype · demo data"** badge:
> "The products are an illustrative demo catalogue, not real listings."

### 0:30 The 10 questions (75 s)
Click **Start the questionnaire**. Point at the step label: "Step 1 of 5 · Questions 1–2 of 10".

1. **Q1–Q2:** *Sibling* → *Graduation*. Click Next.
   *Optional:* click Next before choosing anything to show the validation message.
2. **Q3–Q4:** interests *Reading* and *Technology*; personality *Calm and reflective*. Click Next.
3. **Q5–Q6:** style *Practical*; gift type *Gadget*. Click Next.
4. **Q7–Q9:** in "mentioned wanting", type **noise cancelling headphones**. Leave Q8 and Q9 empty for now. Click Next.
   > "We ask what they've said they want, what they already have and what to avoid. We only ask about items, never personal details."
5. **Q10:** custom budget **100** to **500**. Click **Show my gift ideas**.

### 1:45 Personalised results (45 s)
- **#1 Wireless noise-cancelling earbuds**, SAR 399, **77% match**, with the "⭐ On their wish list" badge.
  > "It's first because they mentioned wanting headphones. A known wish gets the highest weight. The sentence and the bullet list explain exactly why."
- Open **"How was this scored?"**:
  > "The score is fully transparent: wish 30%, interests 25%, gift style 15%, gift type 10%, personality 10%, occasion and relationship 10%. It's rule-based scoring, not a trained AI model. We would add machine learning later, once we have real, consented user feedback."
- Point at the card's retailer line ("not verified yet · demo item") and the yellow demo-data notice.

### 2:30 Exclusions and changing answers (45 s)
1. Click **Edit: Wishes & avoid**. All answers are still there. In Q8, type **headphones** and click **Update results**.
   > "If they already own headphones, the earbuds disappear. Now the smart desk lamp and the e-reader lead."
2. Click **Edit: Wishes & avoid** again, choose **Electronics** under Q9, and click **Update results**.
   > "Avoid electronics, and every gadget is removed. You can open this list to see exactly what was removed and why."
   Open the "items were removed" section to show it.
3. Click **Edit: Budget**, choose **Under SAR 100**, and click Show.
   > "The budget is a strict filter. Every result is now under SAR 100."

### 3:15 Close (15 s)
> "Next we'll test it with real users (we've prepared a UAT plan), add an Arabic interface and verified retailer partners, and later the consent-based social profile. No personal data is stored."

---

### Backup profiles (tested)
| Profile | Answers | Expected result |
|---|---|---|
| Friend's birthday | Friend · Birthday · Reading + Games and puzzles · Cosy homebody + Social · Fun · Hobby gear · SAR 150–250 | #1 Strategy board game (82%) |
| Parent at Eid | Parent · Eid · Coffee + Fragrance and oud · Traditional · Sentimental + Luxurious · Q8 "dallah" · avoid Food & sweets · SAR 200–400 | #1 Oud fragrance sampler (79%); dallah set listed as removed |
| Partner anniversary | Partner · Anniversary · Travel + Photography · Adventurous · Sentimental · An experience · Q7 "stargazing" · custom SAR 100–700 | #1 Desert dune and stargazing trip voucher (85%) |

### Likely judge questions
- **"Is this AI?"** Not yet. It's transparent, rule-based content matching. Every score can be checked by hand. ML is planned once we have real, consented feedback data.
- **"Does the TikTok feature work?"** No. Option B is a future concept and is labelled "Coming later". It would only use the recipient's own authorised account, never scraping or someone else's handle.
- **"Are these real products, prices and shops?"** No. They're illustrative demo data. No retailers are verified or partnered yet, and the app says so on every card.
- **"What data do you collect?"** Only the answers, used for one calculation. Nothing is stored, and no names or contact details are collected.
- **"Why do wishes count most?"** Something the recipient has actually said they want is the strongest signal we have. It still has to fit the budget and must not be on the avoid list.
