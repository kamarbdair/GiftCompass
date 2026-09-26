#!/usr/bin/env python3
"""Build data/products_demo.csv, the GiftCompass demo gift catalog.

DEMO DATA. Every row is written for prototype development only: the item type,
category and SAR price band are realistic for the Jeddah market, but no price has
been quoted and no listing has been checked. product_url is therefore always
empty and data_status is always "demo". Rows must be re-sourced against real
listings and flipped to data_status="verified" before any real user sees them.

Columns are a flat serialisation of docs/schemas/product.schema.json.
Array fields are pipe-separated.
"""

import csv
import pathlib

ALL_REL = ["friend", "best_friend", "partner", "mother", "father", "sister",
           "brother", "relative", "colleague", "classmate"]
CLOSE_REL = ["friend", "best_friend", "partner", "mother", "father", "sister",
             "brother", "relative"]
INTIMATE_REL = ["partner", "best_friend", "sister", "mother"]
NEUTRAL_OCC = ["birthday", "graduation", "thank_you", "just_because", "eid", "achievement"]
ALL_OCC = ["birthday", "graduation", "anniversary", "wedding", "achievement",
           "thank_you", "just_because", "eid", "new_job"]

# Per-category defaults. Individual items override with the 6th tuple element.
CAT = {
    "drinkware": dict(occasions=NEUTRAL_OCC, relationship_fit=ALL_REL, giftability=0.88,
                      embarrassment_risk=0.05, novelty=0.55, age=(16, 70), delivery=3,
                      style=["minimal", "cozy"], retailer="Noon / Tavola / local roastery"),
    "books_stationery": dict(occasions=NEUTRAL_OCC, relationship_fit=ALL_REL, giftability=0.85,
                             embarrassment_risk=0.08, novelty=0.5, age=(12, 70), delivery=2,
                             style=["minimal", "classic"], retailer="Jarir / Noon"),
    "beauty_fragrance": dict(occasions=NEUTRAL_OCC, relationship_fit=CLOSE_REL, giftability=0.80,
                             embarrassment_risk=0.18, novelty=0.45, age=(16, 70), delivery=3,
                             style=["classic", "luxury"], retailer="Nice One / Whites / Arabian Oud"),
    "tech_gaming": dict(occasions=ALL_OCC, relationship_fit=ALL_REL, giftability=0.85,
                        embarrassment_risk=0.05, novelty=0.5, age=(12, 65), delivery=3,
                        style=["modern", "practical"], retailer="Jarir / Extra / Amazon.sa"),
    "sports_fitness": dict(occasions=NEUTRAL_OCC, relationship_fit=ALL_REL, giftability=0.80,
                           embarrassment_risk=0.22, novelty=0.5, age=(12, 65), delivery=3,
                           style=["sporty", "practical"], retailer="Sun & Sand Sports / Decathlon"),
    "home_decor": dict(occasions=ALL_OCC, relationship_fit=ALL_REL, giftability=0.82,
                       embarrassment_risk=0.10, novelty=0.5, age=(16, 75), delivery=4,
                       style=["minimal", "cozy"], retailer="IKEA / Homes R Us / Noon"),
    "jewellery_watches": dict(occasions=["birthday", "anniversary", "wedding", "graduation", "eid", "achievement"],
                              relationship_fit=INTIMATE_REL, giftability=0.85,
                              embarrassment_risk=0.35, novelty=0.45, age=(16, 70), delivery=4,
                              style=["classic", "luxury"], retailer="Jarir / Noon / local jeweller"),
    "hobby_collectibles": dict(occasions=NEUTRAL_OCC, relationship_fit=ALL_REL, giftability=0.88,
                               embarrassment_risk=0.06, novelty=0.65, age=(8, 60), delivery=4,
                               style=["colourful", "modern"], retailer="Jarir / Virgin Megastore / Noon"),
    "food_gourmet": dict(occasions=NEUTRAL_OCC, relationship_fit=ALL_REL, giftability=0.72,
                         embarrassment_risk=0.12, novelty=0.45, age=(12, 80), delivery=2,
                         style=["cozy", "classic"], retailer="Tamimi / Danube / local roastery"),
    "outdoor_travel": dict(occasions=NEUTRAL_OCC, relationship_fit=ALL_REL, giftability=0.82,
                           embarrassment_risk=0.08, novelty=0.55, age=(14, 65), delivery=4,
                           style=["practical", "modern"], retailer="Decathlon / Noon"),
    "experience": dict(occasions=ALL_OCC, relationship_fit=CLOSE_REL, giftability=0.85,
                       embarrassment_risk=0.15, novelty=0.80, age=(16, 65), delivery=0,
                       style=["modern"], retailer="Jeddah venue / experience provider",
                       is_experience=True),
    "pets": dict(occasions=NEUTRAL_OCC, relationship_fit=ALL_REL, giftability=0.75,
                 embarrassment_risk=0.10, novelty=0.55, age=(12, 70), delivery=3,
                 style=["cute", "practical"], retailer="Pet shop / Noon"),
}

# (category, name_en, name_ar, price_sar, interest_keys, overrides)
ITEMS = [
    # ---------------- drinkware (matcha / coffee / cafe) ----------------
    ("drinkware", "Ceremonial matcha starter set (whisk, scoop, bowl)", "طقم ماتشا للمبتدئين (مضرب وملعقة ووعاء)", 189, ["matcha", "cafe_culture"], {}),
    ("drinkware", "Bamboo matcha whisk with ceramic holder", "مضرب ماتشا من الخيزران مع حامل سيراميك", 85, ["matcha"], {}),
    ("drinkware", "Ceremonial grade matcha tin, 30g", "علبة ماتشا فاخرة ٣٠ جم", 120, ["matcha"], {"giftability": 0.75}),
    ("drinkware", "Double-wall glass latte cups, set of 2", "أكواب لاتيه زجاجية مزدوجة الجدار (قطعتان)", 110, ["matcha", "coffee", "cafe_culture"], {}),
    ("drinkware", "Insulated ceramic travel tumbler, 350ml", "كوب سفر سيراميك معزول ٣٥٠ مل", 145, ["coffee", "matcha"], {"personalizable": True}),
    ("drinkware", "Pour-over coffee dripper and carafe set", "طقم تقطير قهوة مع إبريق", 230, ["coffee", "cafe_culture"], {}),
    ("drinkware", "Manual burr coffee grinder, stainless steel", "مطحنة قهوة يدوية من الستانلس ستيل", 320, ["coffee"], {"novelty": 0.6}),
    ("drinkware", "Electric milk frother", "خفاقة حليب كهربائية", 95, ["coffee", "matcha"], {}),
    ("drinkware", "Espresso machine, compact home model", "آلة إسبريسو منزلية مدمجة", 1450, ["coffee"], {"giftability": 0.80, "delivery": 5}),
    ("drinkware", "Specialty coffee subscription, 3 months", "اشتراك قهوة مختصة لمدة ٣ أشهر", 420, ["coffee", "cafe_culture"], {"novelty": 0.75}),
    ("drinkware", "Engraved stainless steel water bottle, 750ml", "قارورة ماء ستانلس ستيل محفورة ٧٥٠ مل", 130, ["fitness", "coffee"], {"personalizable": True}),
    ("drinkware", "Handmade Saudi ceramic mug", "كوب سيراميك سعودي مصنوع يدويًا", 75, ["coffee", "home_decor"], {"novelty": 0.7}),
    ("drinkware", "Arabic coffee dallah with finjan set", "دلة قهوة عربية مع طقم فناجيل", 380, ["coffee", "home_decor"], {"novelty": 0.6}),
    ("drinkware", "Cold brew glass carafe, 1L", "إبريق قهوة باردة زجاجي ١ لتر", 165, ["coffee"], {}),
    ("drinkware", "Matcha and tea gift hamper", "سلة هدايا ماتشا وشاي", 260, ["matcha", "cafe_culture"], {"giftability": 0.9}),

    # ---------------- books_stationery ----------------
    ("books_stationery", "Leather-bound refillable journal A5", "دفتر جلدي قابل لإعادة التعبئة مقاس A5", 140, ["reading", "stationery"], {"personalizable": True}),
    ("books_stationery", "Fountain pen with ink cartridge set", "قلم حبر مع طقم خراطيش", 210, ["stationery"], {"personalizable": True}),
    ("books_stationery", "Adjustable bamboo book stand", "حامل كتب خشبي قابل للتعديل", 95, ["reading"], {}),
    ("books_stationery", "Clip-on rechargeable reading light", "إضاءة قراءة قابلة للشحن بمشبك", 65, ["reading"], {}),
    ("books_stationery", "Arabic contemporary fiction bundle, 3 novels", "مجموعة روايات عربية معاصرة (٣ روايات)", 175, ["reading"], {}),
    ("books_stationery", "English bestseller bundle, 3 paperbacks", "مجموعة كتب إنجليزية الأكثر مبيعًا (٣ كتب)", 190, ["reading"], {}),
    ("books_stationery", "E-reader, 6in with warm backlight", "قارئ إلكتروني ٦ بوصة بإضاءة دافئة", 690, ["reading", "technology"], {"delivery": 4}),
    ("books_stationery", "Annotation kit: tabs, pastel highlighters, sticky notes", "طقم تدوين ملاحظات: فواصل وأقلام تظليل وملصقات", 70, ["reading", "stationery"], {"novelty": 0.6}),
    ("books_stationery", "Personalised embossed bookmark set", "طقم فواصل كتب محفورة بالاسم", 85, ["reading"], {"personalizable": True, "novelty": 0.7}),
    ("books_stationery", "Hardcover sketchbook, 200gsm", "دفتر رسم بغلاف صلب ٢٠٠ جم", 110, ["art", "stationery"], {}),
    ("books_stationery", "Calligraphy starter kit, Arabic script", "طقم خط عربي للمبتدئين", 160, ["art", "stationery"], {"novelty": 0.75}),
    ("books_stationery", "Desk planner and habit tracker set", "طقم مخطط مكتبي ومتتبع عادات", 90, ["stationery"], {}),
    ("books_stationery", "Bookshop gift card", "بطاقة هدايا مكتبة", 200, ["reading"], {"giftability": 0.6, "novelty": 0.2, "delivery": 0}),
    ("books_stationery", "Library-style wooden bookends, pair", "مساند كتب خشبية (زوج)", 125, ["reading", "home_decor"], {}),
    ("books_stationery", "Premium notebook set, dotted and lined", "طقم دفاتر فاخرة منقطة ومسطرة", 105, ["stationery"], {}),

    # ---------------- beauty_fragrance ----------------
    ("beauty_fragrance", "Oud gift box with bakhoor burner", "علبة هدايا عود مع مبخرة", 480, ["fragrance"], {"novelty": 0.5}),
    ("beauty_fragrance", "Layered oud and amber perfume, 50ml", "عطر عود وعنبر ٥٠ مل", 350, ["fragrance"], {}),
    ("beauty_fragrance", "Niche fragrance discovery set, 5 vials", "طقم اكتشاف عطور نيتش (٥ عينات)", 290, ["fragrance"], {"novelty": 0.8}),
    ("beauty_fragrance", "Electric bakhoor burner, USB", "مبخرة كهربائية بمنفذ USB", 165, ["fragrance", "home_decor"], {}),
    ("beauty_fragrance", "Vitamin C serum and moisturiser duo", "سيروم فيتامين سي مع مرطب", 240, ["skincare"], {"embarrassment_risk": 0.30}),
    ("beauty_fragrance", "Gentle cleanser and SPF 50 set", "غسول لطيف مع واقي شمس SPF 50", 190, ["skincare"], {"embarrassment_risk": 0.28}),
    ("beauty_fragrance", "Jade roller and gua sha set", "طقم رولر جيد وجوا شا", 85, ["skincare"], {}),
    ("beauty_fragrance", "Silk pillowcase and scrunchie set", "طقم غطاء وسادة حرير مع ربطة شعر", 180, ["skincare", "home_decor"], {}),
    ("beauty_fragrance", "Hydrating sheet mask box, 10 masks", "علبة أقنعة ورقية مرطبة (١٠ أقنعة)", 95, ["skincare"], {}),
    ("beauty_fragrance", "Scented soy candle trio", "ثلاثية شموع صويا معطرة", 145, ["home_decor", "fragrance"], {}),
    ("beauty_fragrance", "Hair and body oil gift duo", "ثنائية زيت الشعر والجسم", 130, ["skincare"], {}),
    ("beauty_fragrance", "Refillable travel perfume atomiser", "بخاخ عطر للسفر قابل لإعادة التعبئة", 70, ["fragrance", "travel"], {}),
    ("beauty_fragrance", "Makeup brush set with case", "طقم فرش مكياج مع حقيبة", 220, ["makeup"], {"embarrassment_risk": 0.35, "relationship_fit": INTIMATE_REL}),
    ("beauty_fragrance", "Luxury hand cream trio", "ثلاثية كريم يدين فاخر", 155, ["skincare"], {}),

    # ---------------- tech_gaming ----------------
    ("tech_gaming", "Wireless noise-cancelling headphones", "سماعات لاسلكية بخاصية عزل الضوضاء", 890, ["music", "technology"], {"delivery": 4}),
    ("tech_gaming", "True wireless earbuds, mid-range", "سماعات لاسلكية صغيرة (فئة متوسطة)", 390, ["music", "technology"], {}),
    ("tech_gaming", "Mechanical keyboard, 75% layout", "لوحة مفاتيح ميكانيكية بحجم ٧٥٪", 520, ["gaming", "technology"], {"novelty": 0.6}),
    ("tech_gaming", "Lightweight wireless gaming mouse", "ماوس ألعاب لاسلكي خفيف", 280, ["gaming"], {}),
    ("tech_gaming", "Extended desk mat, stitched edges", "سجادة مكتب كبيرة بحواف مخيطة", 95, ["gaming", "technology"], {}),
    ("tech_gaming", "Controller charging dock with RGB", "قاعدة شحن يد تحكم مع إضاءة RGB", 160, ["gaming"], {}),
    ("tech_gaming", "Game gift card, 200 SAR", "بطاقة ألعاب رقمية ٢٠٠ ريال", 200, ["gaming"], {"giftability": 0.55, "novelty": 0.2, "delivery": 0}),
    ("tech_gaming", "Portable power bank, 20000mAh", "بطارية متنقلة ٢٠٠٠٠ مللي أمبير", 180, ["technology", "travel"], {}),
    ("tech_gaming", "Smart LED light bars for desk, pair", "أعمدة إضاءة ذكية للمكتب (زوج)", 240, ["gaming", "home_decor"], {}),
    ("tech_gaming", "Bluetooth portable speaker, waterproof", "مكبر صوت بلوتوث محمول ضد الماء", 310, ["music", "outdoors"], {}),
    ("tech_gaming", "Instant photo printer for phone", "طابعة صور فورية للجوال", 450, ["photography"], {"novelty": 0.75}),
    ("tech_gaming", "Instant camera with film pack", "كاميرا فورية مع علبة أفلام", 520, ["photography"], {"novelty": 0.7}),
    ("tech_gaming", "Phone gimbal stabiliser", "مثبت جوال (جيمبال)", 470, ["photography"], {}),
    ("tech_gaming", "Clip-on phone lens kit", "طقم عدسات للجوال", 140, ["photography"], {}),
    ("tech_gaming", "Smart fitness band", "سوار لياقة ذكي", 260, ["fitness", "technology"], {}),
    ("tech_gaming", "Vinyl turntable, belt drive", "مشغل أسطوانات فينيل", 1290, ["music"], {"delivery": 6, "novelty": 0.7}),
    ("tech_gaming", "MIDI keyboard controller, 25 keys", "لوحة مفاتيح ميدي ٢٥ مفتاح", 640, ["music"], {"novelty": 0.7}),
    ("tech_gaming", "Handheld retro game console", "جهاز ألعاب ريترو محمول", 330, ["gaming", "collectibles"], {"novelty": 0.8}),

    # ---------------- sports_fitness ----------------
    ("sports_fitness", "Official football club scarf", "وشاح نادي كرة قدم رسمي", 130, ["football"], {"novelty": 0.5}),
    ("sports_fitness", "Football club home jersey", "قميص نادي كرة قدم", 420, ["football"], {"requires_size": True, "embarrassment_risk": 0.30}),
    ("sports_fitness", "Signed-style framed football print", "لوحة مؤطرة لكرة القدم", 260, ["football", "home_decor"], {}),
    ("sports_fitness", "Match ball, size 5", "كرة قدم مقاس ٥", 175, ["football"], {}),
    ("sports_fitness", "Formula 1 team cap", "قبعة فريق فورمولا ١", 160, ["formula1"], {}),
    ("sports_fitness", "F1 team softshell jacket", "جاكيت فريق فورمولا ١", 690, ["formula1", "fashion"], {"requires_size": True}),
    ("sports_fitness", "Yoga mat with carry strap", "سجادة يوغا مع حزام حمل", 150, ["fitness"], {}),
    ("sports_fitness", "Adjustable dumbbell pair", "زوج دمبل قابل للتعديل", 560, ["fitness"], {"delivery": 5}),
    ("sports_fitness", "Resistance band set with door anchor", "طقم أحزمة مقاومة مع مثبت باب", 110, ["fitness"], {}),
    ("sports_fitness", "Massage gun, compact", "جهاز مساج عضلي مدمج", 480, ["fitness"], {}),
    ("sports_fitness", "Gym duffel bag with shoe compartment", "حقيبة رياضية مع جيب للأحذية", 230, ["fitness", "travel"], {}),
    ("sports_fitness", "Running belt and hydration flask", "حزام جري مع قارورة ماء", 120, ["fitness", "outdoors"], {}),
    ("sports_fitness", "Padel racket, beginner", "مضرب بادل للمبتدئين", 390, ["fitness"], {"novelty": 0.7}),
    ("sports_fitness", "Snorkelling mask and fins set", "طقم نظارة وزعانف غطس", 320, ["sea_diving", "outdoors"], {"novelty": 0.7}),

    # ---------------- home_decor ----------------
    ("home_decor", "Minimal desk lamp with wireless charging", "مصباح مكتب بسيط مع شحن لاسلكي", 285, ["home_decor", "technology"], {}),
    ("home_decor", "Ceramic diffuser with essential oils", "موزع عطر سيراميك مع زيوت عطرية", 195, ["home_decor", "fragrance"], {}),
    ("home_decor", "Framed minimalist line-art print set", "طقم لوحات فن خطي بسيط مؤطرة", 175, ["home_decor", "art"], {}),
    ("home_decor", "Chunky knit throw blanket", "بطانية محبوكة سميكة", 240, ["home_decor"], {"style": ["cozy"]}),
    ("home_decor", "Personalised name neon sign", "لوحة نيون بالاسم", 420, ["home_decor"], {"personalizable": True, "novelty": 0.75, "delivery": 7}),
    ("home_decor", "Sunset projection lamp", "مصباح إسقاط غروب الشمس", 90, ["home_decor"], {"novelty": 0.65}),
    ("home_decor", "Set of 3 ceramic planters", "طقم ٣ أصص سيراميك", 135, ["plants", "home_decor"], {}),
    ("home_decor", "Low-maintenance indoor plant with pot", "نبتة داخلية سهلة العناية مع أصيص", 110, ["plants"], {"delivery": 2}),
    ("home_decor", "Preserved rose in glass dome", "وردة محفوظة داخل قبة زجاجية", 230, ["home_decor"], {"occasions": ["anniversary", "birthday", "just_because"], "relationship_fit": INTIMATE_REL}),
    ("home_decor", "Wall shelf set, floating oak", "طقم رفوف حائط خشب بلوط", 260, ["home_decor"], {"delivery": 6}),
    ("home_decor", "Aroma humidifier with night light", "مرطب جو مع إضاءة ليلية", 175, ["home_decor"], {}),
    ("home_decor", "Photo frame collage set, 6 frames", "طقم إطارات صور (٦ إطارات)", 145, ["home_decor", "photography"], {"personalizable": True}),
    ("home_decor", "Handwoven Saudi-pattern cushion cover pair", "غطاء وسادة بنقشة سعودية (زوج)", 120, ["home_decor"], {"novelty": 0.7}),
    ("home_decor", "Bedside charging valet tray", "صينية مكتب مع شاحن", 165, ["home_decor", "technology"], {}),

    # ---------------- jewellery_watches ----------------
    ("jewellery_watches", "Minimalist analogue watch, leather strap", "ساعة كلاسيكية بسيطة بسوار جلدي", 480, ["watches", "fashion"], {}),
    ("jewellery_watches", "Stainless steel dress watch", "ساعة رسمية من الستانلس ستيل", 890, ["watches"], {}),
    ("jewellery_watches", "Smartwatch, mid-range", "ساعة ذكية (فئة متوسطة)", 950, ["watches", "technology", "fitness"], {"relationship_fit": CLOSE_REL, "embarrassment_risk": 0.2}),
    ("jewellery_watches", "Watch winder and storage box", "صندوق حفظ وتدوير الساعات", 390, ["watches"], {"novelty": 0.65}),
    ("jewellery_watches", "Personalised name necklace, gold plated", "قلادة بالاسم مطلية بالذهب", 320, ["jewellery"], {"personalizable": True, "delivery": 7}),
    ("jewellery_watches", "Pearl stud earrings", "أقراط لؤلؤ", 260, ["jewellery"], {}),
    ("jewellery_watches", "Layered chain bracelet set", "طقم أساور سلسلة متعددة", 180, ["jewellery"], {}),
    ("jewellery_watches", "Birthstone pendant", "قلادة بحجر الميلاد", 240, ["jewellery"], {"personalizable": True}),
    ("jewellery_watches", "Engraved cufflinks", "أزرار أكمام محفورة", 210, ["jewellery", "fashion"], {"personalizable": True}),
    ("jewellery_watches", "Velvet jewellery travel case", "علبة مجوهرات مخملية للسفر", 140, ["jewellery", "travel"], {"relationship_fit": CLOSE_REL, "embarrassment_risk": 0.15}),
    ("jewellery_watches", "Leather watch strap, quick release", "سوار ساعة جلدي سريع الفك", 130, ["watches"], {"relationship_fit": CLOSE_REL}),
    ("jewellery_watches", "Gold-plated anklet", "خلخال مطلي بالذهب", 165, ["jewellery"], {"relationship_fit": ["partner", "sister", "best_friend"], "embarrassment_risk": 0.5}),

    # ---------------- hobby_collectibles ----------------
    ("hobby_collectibles", "LEGO Technic racing car set", "طقم ليغو تكنيك سيارة سباق", 640, ["cars", "formula1", "collectibles"], {"age": (10, 60)}),
    ("hobby_collectibles", "1:43 die-cast F1 car model", "مجسم سيارة فورمولا ١ بمقياس ١:٤٣", 290, ["formula1", "cars", "collectibles"], {"novelty": 0.7}),
    ("hobby_collectibles", "1:18 die-cast sports car model", "مجسم سيارة رياضية بمقياس ١:١٨", 520, ["cars", "collectibles"], {}),
    ("hobby_collectibles", "F1 circuit wall art, framed", "لوحة حلبة فورمولا ١ مؤطرة", 210, ["formula1", "home_decor"], {}),
    ("hobby_collectibles", "Remote control drift car", "سيارة تحكم عن بعد للانزلاق", 380, ["cars", "gaming"], {"age": (10, 45)}),
    ("hobby_collectibles", "Collector display case, acrylic", "صندوق عرض أكريليك للمقتنيات", 175, ["collectibles"], {}),
    ("hobby_collectibles", "Anime character figure, licensed", "مجسم شخصية أنمي مرخص", 260, ["collectibles"], {"novelty": 0.7}),
    ("hobby_collectibles", "Strategy board game, 2-4 players", "لعبة لوحية استراتيجية (٢-٤ لاعبين)", 230, ["board_games"], {"age": (10, 60)}),
    ("hobby_collectibles", "Party card game, Arabic edition", "لعبة ورق جماعية بالعربية", 95, ["board_games"], {"age": (12, 60), "novelty": 0.6}),
    ("hobby_collectibles", "1000-piece art puzzle", "أحجية ١٠٠٠ قطعة", 85, ["board_games", "art"], {}),
    ("hobby_collectibles", "Wooden chess set, weighted pieces", "طقم شطرنج خشبي بقطع موزونة", 340, ["board_games"], {}),
    ("hobby_collectibles", "Acrylic paint set with canvases", "طقم ألوان أكريليك مع لوحات قماشية", 165, ["art"], {}),
    ("hobby_collectibles", "Digital drawing tablet, entry level", "لوح رسم رقمي للمبتدئين", 420, ["art", "technology"], {}),
    ("hobby_collectibles", "Pottery clay starter kit", "طقم فخار للمبتدئين", 190, ["art"], {"novelty": 0.75}),
    ("hobby_collectibles", "Model building kit, wooden mechanical", "طقم تجميع ميكانيكي خشبي", 145, ["collectibles", "board_games"], {"novelty": 0.75}),
    ("hobby_collectibles", "Vinyl record of a classic album", "أسطوانة فينيل لألبوم كلاسيكي", 160, ["music", "collectibles"], {}),

    # ---------------- food_gourmet ----------------
    ("food_gourmet", "Premium date and chocolate gift box", "علبة هدايا تمر وشوكولاتة فاخرة", 210, ["sweets"], {"novelty": 0.35}),
    ("food_gourmet", "Artisan chocolate selection box", "علبة شوكولاتة حرفية مختارة", 175, ["sweets"], {}),
    ("food_gourmet", "Single-origin coffee beans trio", "ثلاثية حبوب قهوة أحادية المصدر", 190, ["coffee"], {}),
    ("food_gourmet", "Loose-leaf tea sampler tin set", "طقم علب شاي أوراق مختارة", 145, ["cafe_culture", "matcha"], {}),
    ("food_gourmet", "Gourmet honey and nut hamper", "سلة عسل ومكسرات فاخرة", 265, ["cooking"], {}),
    ("food_gourmet", "Spice and seasoning gift rack", "رف بهارات وتوابل للهدية", 180, ["cooking"], {}),
    ("food_gourmet", "Olive oil and balsamic duo", "ثنائية زيت زيتون وخل بلسمي", 155, ["cooking"], {}),
    ("food_gourmet", "Chef knife, Japanese steel", "سكين شيف من الفولاذ الياباني", 430, ["cooking"], {"embarrassment_risk": 0.25}),
    ("food_gourmet", "Cast iron skillet, pre-seasoned", "مقلاة حديد زهر مجهزة", 240, ["cooking"], {}),
    ("food_gourmet", "Baking starter set with silicone moulds", "طقم خبز مع قوالب سيليكون", 165, ["cooking", "sweets"], {}),
    ("food_gourmet", "Digital kitchen scale and thermometer", "ميزان مطبخ رقمي مع مقياس حرارة", 120, ["cooking"], {}),
    ("food_gourmet", "Personalised cutting board, engraved", "لوح تقطيع محفور بالاسم", 195, ["cooking"], {"personalizable": True, "delivery": 7}),

    # ---------------- outdoor_travel ----------------
    ("outdoor_travel", "Cabin trolley suitcase, hard shell", "حقيبة سفر صلبة بحجم المقصورة", 590, ["travel"], {"delivery": 5}),
    ("outdoor_travel", "Leather passport holder and luggage tag", "حافظة جواز جلدية مع بطاقة حقيبة", 165, ["travel"], {"personalizable": True}),
    ("outdoor_travel", "Packing cube set, 6 pieces", "طقم تنظيم حقائب (٦ قطع)", 110, ["travel"], {}),
    ("outdoor_travel", "Travel neck pillow and eye mask set", "طقم وسادة رقبة وغطاء عين للسفر", 95, ["travel"], {}),
    ("outdoor_travel", "Universal travel adapter with USB-C", "محول سفر عالمي مع منفذ USB-C", 130, ["travel", "technology"], {}),
    ("outdoor_travel", "Scratch-off world map poster", "خريطة عالم قابلة للكشط", 120, ["travel", "home_decor"], {"novelty": 0.7}),
    ("outdoor_travel", "2-person camping tent", "خيمة تخييم لشخصين", 480, ["outdoors"], {"delivery": 5}),
    ("outdoor_travel", "Portable camping chair, folding", "كرسي تخييم محمول قابل للطي", 175, ["outdoors"], {}),
    ("outdoor_travel", "Insulated cooler backpack", "حقيبة ظهر مبردة معزولة", 230, ["outdoors", "travel"], {}),
    ("outdoor_travel", "Rechargeable camping lantern", "فانوس تخييم قابل للشحن", 140, ["outdoors"], {}),
    ("outdoor_travel", "Beach towel and dry bag set", "طقم منشفة شاطئ مع حقيبة مقاومة للماء", 130, ["sea_diving", "outdoors"], {}),
    ("outdoor_travel", "Waterproof action camera mount kit", "طقم حوامل كاميرا أكشن مقاوم للماء", 195, ["sea_diving", "photography"], {}),

    # ---------------- experience ----------------
    ("experience", "Latte art workshop for two, Jeddah", "ورشة فن اللاتيه لشخصين، جدة", 380, ["coffee", "cafe_culture"], {}),
    ("experience", "Matcha and pastry tasting for two", "تجربة تذوق ماتشا ومعجنات لشخصين", 260, ["matcha", "cafe_culture"], {}),
    ("experience", "Pottery class, single session", "درس فخار (جلسة واحدة)", 320, ["art"], {}),
    ("experience", "Acrylic painting night for two", "أمسية رسم بالأكريليك لشخصين", 280, ["art"], {}),
    ("experience", "Red Sea discovery dive, beginner", "غطسة استكشافية في البحر الأحمر للمبتدئين", 650, ["sea_diving", "outdoors"], {"age": (16, 55)}),
    ("experience", "Sunset boat trip, Jeddah corniche", "رحلة قارب عند الغروب، كورنيش جدة", 450, ["sea_diving", "travel"], {}),
    ("experience", "Karting session, 2 races", "جلسة كارتينغ (سباقان)", 220, ["formula1", "cars"], {"age": (12, 55)}),
    ("experience", "Football match ticket, local league", "تذكرة مباراة كرة قدم للدوري المحلي", 180, ["football"], {"novelty": 0.6}),
    ("experience", "Escape room for a group of four", "غرفة هروب لمجموعة من ٤ أشخاص", 400, ["board_games"], {"age": (12, 55)}),
    ("experience", "Photography walk workshop", "ورشة تصوير ميدانية", 350, ["photography"], {}),
    ("experience", "Spa day voucher", "قسيمة يوم سبا", 550, ["skincare"], {"relationship_fit": INTIMATE_REL, "embarrassment_risk": 0.35}),
    ("experience", "Cooking class, Saudi cuisine", "درس طبخ للمأكولات السعودية", 380, ["cooking"], {}),
    ("experience", "Concert or live music ticket", "تذكرة حفل موسيقي", 420, ["music"], {"novelty": 0.6}),
    ("experience", "Desert stargazing trip for two", "رحلة مراقبة النجوم في الصحراء لشخصين", 520, ["outdoors", "travel"], {"novelty": 0.8}),

    # ---------------- pets ----------------
    ("pets", "Personalised pet collar with name tag", "طوق حيوان أليف بالاسم", 95, ["pets"], {"personalizable": True}),
    ("pets", "Cat tree with scratching posts", "شجرة قطط مع أعمدة خدش", 340, ["pets"], {"delivery": 5}),
    ("pets", "Interactive dog puzzle toy", "لعبة أحجية تفاعلية للكلاب", 110, ["pets", "board_games"], {}),
    ("pets", "Orthopaedic pet bed, medium", "سرير حيوان أليف طبي (متوسط)", 230, ["pets"], {}),
    ("pets", "Automatic pet water fountain", "نافورة ماء أوتوماتيكية للحيوانات", 190, ["pets", "technology"], {}),
    ("pets", "Pet grooming kit", "طقم عناية بالحيوانات الأليفة", 145, ["pets"], {}),
    ("pets", "Custom pet portrait, printed and framed", "لوحة مطبوعة مؤطرة لحيوانك الأليف", 265, ["pets", "art", "home_decor"], {"personalizable": True, "novelty": 0.8, "delivery": 8}),
    ("pets", "Pet treat and toy gift box", "علبة هدايا مكافآت وألعاب للحيوانات", 120, ["pets"], {}),

    # ---------------- budget-band coverage: under 100 SAR ----------------
    ("drinkware", "Matcha sifter tin", "علبة منخل ماتشا", 45, ["matcha"], {}),
    ("drinkware", "Reusable iced coffee cup with straw", "كوب قهوة مثلجة قابل لإعادة الاستخدام مع شفاطة", 55, ["coffee", "cafe_culture"], {}),
    ("food_gourmet", "Single-origin coffee bag, 250g", "كيس قهوة أحادية المصدر ٢٥٠ جم", 80, ["coffee"], {}),
    ("books_stationery", "Pocket poetry collection", "ديوان شعر بحجم الجيب", 45, ["reading"], {}),
    ("books_stationery", "Gel pen set, 20 colours", "طقم أقلام جل ٢٠ لون", 40, ["stationery", "art"], {}),
    ("tech_gaming", "Phone ring holder and stand", "حلقة مسك وحامل للجوال", 35, ["technology"], {"giftability": 0.55}),
    ("tech_gaming", "Braided cable organiser set", "طقم تنظيم كوابل مجدول", 45, ["technology"], {"giftability": 0.6}),
    ("home_decor", "Small reed diffuser", "موزع عطر صغير بالأعواد", 70, ["home_decor", "fragrance"], {}),
    ("home_decor", "Warm LED string lights, 10m", "إضاءة خيطية دافئة ١٠ متر", 55, ["home_decor"], {}),
    ("beauty_fragrance", "Lip care trio", "ثلاثية العناية بالشفاه", 60, ["skincare"], {}),
    ("sports_fitness", "Football club keyring and lanyard", "ميدالية مفاتيح نادي كرة قدم", 55, ["football"], {}),
    ("sports_fitness", "Weighted skipping rope", "حبل نط موزون", 75, ["fitness"], {}),
    ("hobby_collectibles", "Mini F1 team keyring", "ميدالية مفاتيح فريق فورمولا ١", 50, ["formula1", "collectibles"], {}),
    ("hobby_collectibles", "Premium playing card deck", "مجموعة ورق لعب فاخرة", 60, ["board_games"], {}),
    ("outdoor_travel", "Carabiner bottle clip and mini tool", "مشبك قارورة مع أداة صغيرة", 40, ["outdoors"], {}),
    ("pets", "Catnip toy set", "طقم ألعاب النعناع البري للقطط", 45, ["pets"], {}),

    # ---------------- budget-band coverage: 1000+ SAR ----------------
    ("tech_gaming", "Home gaming console bundle", "حزمة جهاز ألعاب منزلي", 1890, ["gaming"], {"delivery": 5}),
    ("tech_gaming", "Entry-level mirrorless camera with kit lens", "كاميرا ميرورليس للمبتدئين مع عدسة", 2450, ["photography"], {"delivery": 5}),
    ("tech_gaming", "Studio over-ear headphones", "سماعات استوديو فوق الأذن", 1150, ["music"], {}),
    ("jewellery_watches", "Gold-plated automatic watch", "ساعة أوتوماتيكية مطلية بالذهب", 1350, ["watches"], {}),
    ("sports_fitness", "Indoor exercise bike", "دراجة تمارين داخلية", 1750, ["fitness"], {"delivery": 7}),
    ("home_decor", "Robot vacuum cleaner", "مكنسة روبوت", 1290, ["home_decor", "technology"], {"delivery": 5, "giftability": 0.7}),
    ("experience", "Weekend desert glamping for two", "إقامة تخييم فاخر في الصحراء لشخصين", 1600, ["outdoors", "travel"], {"novelty": 0.85}),
]


def band(price: float) -> str:
    if price < 100:
        return "under_100"
    if price < 250:
        return "100_250"
    if price < 500:
        return "250_500"
    if price < 1000:
        return "500_1000"
    return "1000_plus"


COLUMNS = ["product_id", "name_en", "name_ar", "category", "tags", "interest_keys",
           "style_tags", "price_sar", "currency", "budget_band", "age_min", "age_max",
           "occasions", "relationship_fit", "giftability", "embarrassment_risk", "novelty",
           "is_experience", "personalizable", "requires_size", "available_in_jeddah",
           "delivery_days", "retailer_hint", "product_url", "image_url", "data_status",
           "verified_at", "notes"]


def build():
    taxonomy_path = pathlib.Path(__file__).resolve().parents[1] / "docs/schemas/interest-taxonomy.json"
    import json
    valid_keys = {i["key"] for i in json.loads(taxonomy_path.read_text())["interests"]}

    rows = []
    for n, (cat, name_en, name_ar, price, keys, ov) in enumerate(ITEMS, start=1):
        d = dict(CAT[cat])
        d.update(ov)
        unknown = set(keys) - valid_keys
        if unknown:
            raise SystemExit(f"{name_en}: interest keys not in taxonomy: {sorted(unknown)}")
        age_min, age_max = d["age"]
        rows.append({
            "product_id": f"GC-{n:04d}",
            "name_en": name_en,
            "name_ar": name_ar,
            "category": cat,
            "tags": "|".join(dict.fromkeys(keys + [cat])),
            "interest_keys": "|".join(keys),
            "style_tags": "|".join(d["style"]),
            "price_sar": price,
            "currency": "SAR",
            "budget_band": band(price),
            "age_min": age_min,
            "age_max": age_max,
            "occasions": "|".join(d["occasions"]),
            "relationship_fit": "|".join(d["relationship_fit"]),
            "giftability": d["giftability"],
            "embarrassment_risk": d["embarrassment_risk"],
            "novelty": d["novelty"],
            "is_experience": str(d.get("is_experience", False)).lower(),
            "personalizable": str(d.get("personalizable", False)).lower(),
            "requires_size": str(d.get("requires_size", False)).lower(),
            "available_in_jeddah": "true",
            "delivery_days": d["delivery"],
            "retailer_hint": d["retailer"],
            "product_url": "",
            "image_url": "",
            "data_status": "demo",
            "verified_at": "",
            "notes": "",
        })

    out = pathlib.Path(__file__).resolve().parents[1] / "data/products_demo.csv"
    with out.open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=COLUMNS)
        w.writeheader()
        w.writerows(rows)
    print(f"wrote {len(rows)} rows -> {out}")
    return rows


if __name__ == "__main__":
    build()
