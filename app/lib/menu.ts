export type DietaryStatus = "vegan" | "vegetarian" | "nonVegetarian" | "unconfirmed" | "notApplicable";

export type MenuCategory = {
  slug: string;
  number: string;
  title: string;
  note: string;
  description: string;
  orderRank: number;
};

export type MenuItem = {
  id: string;
  category: string;
  name: string;
  description: string;
  subheading?: string;
  pricePence: number | null;
  priceLabel?: string;
  hidePrice: boolean;
  isAlcoholic: boolean;
  dietaryStatus: DietaryStatus;
  dietaryReviewStatus: "confirmed" | "needs-review";
  dietary: string[];
  allergens: string[];
  spice: "Gentle" | "Warm" | "Medium" | "Hot" | "Aromatic" | "None";
  available: boolean;
  onlineOrdering: boolean;
  featured: boolean;
  displayOrder: number;
};

type ItemOptions = {
  vegetarian?: boolean;
  vegan?: boolean;
  alcoholic?: boolean;
  dietaryStatus?: DietaryStatus;
  subheading?: string;
  orderable?: boolean;
  description?: string;
  featured?: boolean;
};

type MenuDefinition = {
  slug: string;
  title: string;
  note: string;
  description: string;
  items: Array<readonly [name: string, pricePence: number | null, options?: ItemOptions]>;
};

const item = (name: string, pricePence: number, options: ItemOptions = {}) => [name, pricePence, options] as const;
const vegetarian = (name: string, pricePence: number, options: ItemOptions = {}) => item(name, pricePence, {...options, vegetarian: true});
const alcohol = (name: string, options: ItemOptions = {}) => [name, null, {...options, alcoholic: true, orderable: false}] as const;

const definitions: MenuDefinition[] = [
  {
    slug: "starters", title: "Starters", note: "To begin", description: "Pakora, chaat and small plates.",
    items: [
      vegetarian("Vegetable Pakora", 495), vegetarian("Gobi Pakora", 495), vegetarian("Mushroom Pakora", 495),
      item("Chicken Pakora", 695), item("Fish Pakora", 750), item("Chicken 65", 695), item("Chicken Chaat", 650),
      vegetarian("Potato Skins", 450), item("Mixed Pakora", 795, {dietaryStatus: "unconfirmed"}),
    ],
  },
  {
    slug: "clay-oven", title: "Clay Oven", note: "From the tandoor", description: "Charred in the clay oven.",
    items: [
      item("Tandoori Chicken", 1295, {description: "Bone-in chicken marinated with yoghurt and warm spices, then roasted over fierce tandoor heat."}),
      item("Chicken Tikka", 1295, {description: "Tender yoghurt-spiced chicken, charred in the tandoor for smoky edges and a juicy centre.", featured: true}),
      item("Lamb Tikka", 1495, {description: "Boneless lamb steeped in aromatic spices and cooked in the tandoor until tender and lightly charred."}),
      item("Tandoori Mixed Grill", 1795),
      vegetarian("Paneer Tikka", 1095),
      item("Chicken Shashlik", 1295, {description: "Tandoor-grilled chicken, peppers and onion layered on skewers with a bright, smoky finish."}),
      item("Tandoori Jinga", 1495), item("Masala Chicken Tikka", 1395), item("Masala Lamb", 1495),
    ],
  },
  {
    slug: "chicken", title: "Chicken", note: "Chicken curries", description: "Classic and contemporary chicken dishes.",
    items: [
      item("Traditional Chicken Curry", 1295), item("Chicken Tikka Masala", 1295), item("Butter Chicken", 1295), item("Chicken Chasni", 1295),
      item("Mughlai Korma", 1295), item("Chicken Bhuna", 1395), item("Chicken Jalfrezi", 1350), item("Chicken Dopiaza", 1350),
      item("Chicken Kadai", 1495), item("Indian Garlic Chilli Chicken", 1350), item("Dragon Chicken", 1395), item("Malaidar Chicken", 1295),
    ],
  },
  {
    slug: "beef", title: "Beef", note: "Beef curries", description: "Slow-cooked beef dishes.",
    items: [
      item("Traditional Beef Curry", 1395), item("Beef Chasni", 1395), item("Beef Bhuna", 1495), item("Beef Jalfrezi", 1495),
      item("Beef Kadai", 1495), item("Indian Garlic Chilli Beef", 1395), item("Malaidar Beef", 1395),
    ],
  },
  {
    slug: "lamb", title: "Lamb", note: "Lamb curries", description: "Rich lamb dishes with Malabar spice.",
    items: [
      item("Traditional Lamb Curry", 1395), item("Lamb Chasni", 1395), item("Lamb Bhuna", 1495), item("Lamb Jalfrezi", 1495),
      item("Indian Garlic Chilli Lamb", 1495), item("Malaidar Lamb", 1495),
    ],
  },
  {
    slug: "vegetarian", title: "Vegetarian", note: "Garden & grove", description: "Vegetarian curries and paneer dishes.",
    items: [
      vegetarian("Dal Tadka", 895), vegetarian("Vegetable Mughlai Korma", 995), vegetarian("Paneer Butter Masala", 1050),
      vegetarian("Vegetable Chasni", 995), vegetarian("Aloo Gobi", 895), vegetarian("Cherupayar Curry", 995),
      vegetarian("Kadai Paneer", 1095), vegetarian("Indian Garlic Chilli Vegetables", 1095),
    ],
  },
  {
    slug: "malabar-coast-signature", title: "Malabar Coast Signature", note: "House signatures", description: "Coastal Kerala favourites and Malabar Coast specialities.",
    items: [
      item("Chicken Pollichathu", 1295), item("Kozhi Varutharacha", 1295), item("Aattirachi Kurumulak", 1495, {featured: true, description: "Slow-cooked lamb layered with cracked black pepper, shallots and curry leaves."}),
      item("Beef Roast", 1395), item("Beef Thenga Kothu", 1395), item("Kizhi Porotta", 1495), item("Masala Grilled Fish", 1495, {featured: true}),
      item("Meen Manga Curry", 1495), item("Meen Moilee", 1495), item("Konju Coconut Fry", 1495, {featured: true, description: "Prawns tossed with toasted coconut, curry leaves and Malabar spices for a dry, savoury finish."}),
      item("Prawn Moilee", 1595, {featured: true}), item("Fish Pollichathu", 1595),
    ],
  },
  {
    slug: "biriyani", title: "Biriyani", note: "The dum pot", description: "Fragrant rice dishes.",
    items: [item("Chicken", 1295, {description: "Fragrant basmati rice layered with spiced chicken and slow-cooked together in the dum style."}), item("Beef", 1395), item("Lamb", 1495), item("Fish", 1495)],
  },
  {
    slug: "dosa", title: "Dosa", note: "From the griddle", description: "Crisp South Indian dosas.",
    items: [vegetarian("Thattu Dosa", 695), vegetarian("Ghee Roast", 795), vegetarian("Masala Dosa", 895), item("Chicken Tikka Dosa", 995)],
  },
  {
    slug: "breads", title: "Breads", note: "Alongside", description: "Naan, roti and Kerala breads.",
    items: [
      vegetarian("Plain Naan", 350), vegetarian("Butter Naan", 375), vegetarian("Garlic Naan", 425), vegetarian("Chilli Naan", 450),
      vegetarian("Cheese Naan", 495), vegetarian("Peshwari Naan", 495), item("Keema Naan", 550), vegetarian("Tandoori Roti", 295),
      vegetarian("Kerala Porotta (2)", 350), vegetarian("Appam (3)", 495), vegetarian("Idiyappam (3)", 495), vegetarian("Chapathi (2)", 325), vegetarian("Chips", 225),
    ],
  },
  {
    slug: "rice", title: "Rice", note: "Rice", description: "Steamed and seasoned rice.",
    items: [vegetarian("Plain Rice", 350), vegetarian("Pilau Rice", 425), vegetarian("Coconut Rice", 425), vegetarian("Ghee Rice", 425), vegetarian("Mushroom Pilau", 450)],
  },
  {
    slug: "sundries", title: "Sundries", note: "On the side", description: "Chutneys, pickles and sauces.",
    items: [vegetarian("Poppadom", 95), vegetarian("Mixed Pickle", 95), vegetarian("Mango Chutney", 95), vegetarian("Spiced Onion", 95), vegetarian("Raita", 175), vegetarian("Pakora Sauce", 50), vegetarian("Pickle Tray", 249)],
  },
  {
    slug: "kids-menu", title: "Kids Menu", note: "Little diners", description: "Child-sized favourites.",
    items: [item("Chicken Chasni", 795), item("Chicken Korma", 795), item("Chicken Nuggets & Chips", 795), item("Fish Fingers & Chips", 795), item("Fish & Chips", 795)],
  },
  {
    slug: "desserts", title: "Desserts", note: "Something sweet", description: "Traditional sweets and ice cream.",
    items: [vegetarian("Gulab Jamun", 495, {featured: true, description: "Soft golden milk dumplings soaked in fragrant cardamom and saffron syrup."}), vegetarian("Palada Payasam", 495), vegetarian("Malabar Coast Special Dessert", 595), vegetarian("Ice Cream", 350)],
  },
  {
    slug: "soft-drinks", title: "Soft Drinks", note: "Cold drinks", description: "Soft drinks, soda and juice.",
    items: [
      item("Cola", 250, {dietaryStatus: "notApplicable"}), item("Cola Zero", 250, {dietaryStatus: "notApplicable"}), item("Diet Cola", 250, {dietaryStatus: "notApplicable"}),
      item("Pepsi Max", 250, {dietaryStatus: "notApplicable"}), item("Irn-Bru", 250, {dietaryStatus: "notApplicable"}), item("Diet Irn-Bru", 250, {dietaryStatus: "notApplicable"}),
      item("Tango", 250, {dietaryStatus: "notApplicable"}), item("Lemonade", 250, {dietaryStatus: "notApplicable"}), item("Mango Soda", 350, {dietaryStatus: "notApplicable"}),
      item("Lime Soda", 350, {dietaryStatus: "notApplicable"}), item("Mango Juice", 395, {dietaryStatus: "notApplicable"}),
      item("Tender Coconut Water", 395, {dietaryStatus: "notApplicable"}), item("Fruit Shoot", 150, {dietaryStatus: "notApplicable"}),
    ],
  },
  {
    slug: "tea-coffee", title: "Tea & Coffee", note: "Hot drinks", description: "Tea, coffee and warming favourites.",
    items: [
      item("Tea", 250, {dietaryStatus: "notApplicable"}), item("Black Tea", 225, {dietaryStatus: "notApplicable"}), item("Coffee", 295, {dietaryStatus: "notApplicable"}),
      item("Masala Chai", 295, {dietaryStatus: "notApplicable"}), item("Boost", 325, {dietaryStatus: "notApplicable"}), item("Horlicks", 325, {dietaryStatus: "notApplicable"}),
    ],
  },
  {
    slug: "draught-beer", title: "Draught Beer", note: "From the tap", description: "Draught beer. Prices are intentionally not published online.",
    items: [
      alcohol("Cobra Half"), alcohol("Cobra Pint"), alcohol("Kingfisher Half"), alcohol("Kingfisher Pint"), alcohol("Madri Half"), alcohol("Madri Pint"),
      alcohol("Aspall Half"), alcohol("Aspall Pint"), alcohol("Bombay Bicycle IPA Half"), alcohol("Bombay Bicycle IPA Pint"),
      alcohol("Tennent's Half"), alcohol("Tennent's Pint"), alcohol("Toddy"),
    ],
  },
  {
    slug: "bottled-beer-cider", title: "Bottled Beer & Cider", note: "Bottles", description: "Beer and cider. Alcoholic-item prices are intentionally not published online.",
    items: [
      alcohol("Kingfisher"), alcohol("Cobra"), alcohol("Corona"), alcohol("Budweiser"), alcohol("Peroni"),
      item("Peroni Zero", 400, {dietaryStatus: "notApplicable", orderable: false}), item("Madri Zero", 400, {dietaryStatus: "notApplicable", orderable: false}),
      alcohol("Strongbow"), alcohol("Magners"),
    ],
  },
  {
    slug: "spirits", title: "Spirits", note: "From the bar", description: "Spirits. Prices are intentionally not published online.",
    items: [
      alcohol("Famous Grouse", {subheading: "Whisky"}), alcohol("Jack Daniel's", {subheading: "Whisky"}), alcohol("Jameson", {subheading: "Whisky"}),
      alcohol("Johnnie Walker Black Label", {subheading: "Whisky"}), alcohol("Glenfiddich 12 Year Old", {subheading: "Whisky"}),
      alcohol("Three Barrels", {subheading: "Cognac"}), alcohol("Courvoisier VS", {subheading: "Cognac"}),
      alcohol("Captain Morgan", {subheading: "Rum"}), alcohol("Bacardi Carta Blanca", {subheading: "Rum"}), alcohol("Malibu", {subheading: "Rum"}),
      alcohol("Smirnoff", {subheading: "Vodka"}), alcohol("Absolut", {subheading: "Vodka"}), alcohol("AU Blue Raspberry", {subheading: "Vodka"}),
      alcohol("Gordon's", {subheading: "Gin"}), alcohol("Bombay Sapphire", {subheading: "Gin"}), alcohol("Whitley Neill Rhubarb & Ginger", {subheading: "Gin"}),
      alcohol("Jose Cuervo Silver", {subheading: "Tequila"}), alcohol("Jose Cuervo Gold", {subheading: "Tequila"}),
      alcohol("Mansion House", {subheading: "Indian Spirits"}), alcohol("Old Monk", {subheading: "Indian Spirits"}), alcohol("Mandakini", {subheading: "Indian Spirits"}),
    ],
  },
  {
    slug: "wine", title: "Wine", note: "Wine & prosecco", description: "Wine. Prices are intentionally not published online.",
    items: [
      alcohol("175ml", {subheading: "House Wines"}), alcohol("250ml", {subheading: "House Wines"}), alcohol("Bottle", {subheading: "House Wines"}),
      alcohol("Bottle", {subheading: "Prosecco"}),
    ],
  },
  {
    slug: "mixers", title: "Mixers", note: "With your drink", description: "Mixers and soft-drink additions.",
    items: [
      item("Mixer with Spirit", 100, {dietaryStatus: "notApplicable", orderable: false}),
      item("Premium Tonic / Bottled Mixer", 150, {dietaryStatus: "notApplicable", orderable: false}),
      item("Soft Drink Mixer", 175, {dietaryStatus: "notApplicable", orderable: false}),
    ],
  },
];

const menuDescriptionByCategory: Record<string, Record<string, string>> = {
  starters: {
    "Vegetable Pakora": "Mixed vegetables coated in seasoned batter and fried until crisp and golden.",
    "Gobi Pakora": "Cauliflower florets wrapped in spiced batter and fried for a crisp, tender bite.",
    "Mushroom Pakora": "Juicy mushrooms in a lightly spiced coating, fried until golden.",
    "Chicken Pakora": "Tender chicken pieces coated in seasoned batter and fried until crisp.",
    "Fish Pakora": "Pieces of fish in a spiced coating, fried for a crisp outside and tender centre.",
    "Chicken 65": "South Indian-style fried chicken tossed with chilli, curry leaves and aromatic spices.",
    "Chicken Chaat": "Spiced chicken finished with onion and bright, tangy chaat seasoning.",
    "Potato Skins": "Crisp potato skins served as a simple, comforting starter.",
    "Mixed Pakora": "A varied selection of freshly fried pakora for sharing.",
  },
  "clay-oven": {
    "Tandoori Mixed Grill": "A generous selection of tandoor-cooked meats with smoky, charred edges.",
    "Paneer Tikka": "Paneer marinated with yoghurt and spices, then charred in the tandoor.",
    "Tandoori Jinga": "Spiced king prawns cooked in the tandoor until smoky and succulent.",
    "Masala Chicken Tikka": "Charred chicken tikka finished with a rich, warmly spiced masala.",
    "Masala Lamb": "Tender lamb cooked with aromatic masala spices and a smoky finish.",
  },
  vegetarian: {
    "Dal Tadka": "Slow-cooked lentils finished with a fragrant tempering of spices.",
    "Vegetable Mughlai Korma": "Mixed vegetables in a mild, creamy Mughlai-style sauce.",
    "Paneer Butter Masala": "Paneer simmered in a smooth, buttery tomato and spice sauce.",
    "Vegetable Chasni": "Mixed vegetables in a creamy sauce balanced with sweet and tangy notes.",
    "Aloo Gobi": "Potato and cauliflower cooked with tomato, herbs and warming spices.",
    "Cherupayar Curry": "Green gram simmered with coconut and gently aromatic Kerala spices.",
    "Kadai Paneer": "Paneer cooked with peppers, tomato and freshly crushed kadai spices.",
    "Indian Garlic Chilli Vegetables": "Mixed vegetables tossed through a bold garlic and chilli sauce.",
  },
  "malabar-coast-signature": {
    "Chicken Pollichathu": "Spiced chicken cooked in the Kerala pollichathu style for a deeply aromatic finish.",
    "Kozhi Varutharacha": "Chicken simmered in a Kerala-style roasted coconut and spice gravy.",
    "Beef Roast": "Beef slow-cooked with onion, curry leaves and spices until rich and dry-roasted.",
    "Beef Thenga Kothu": "Beef tossed with coconut pieces, curry leaves and Malabar spices.",
    "Kizhi Porotta": "Layered porotta and spiced curry bundled together to capture every fragrant flavour.",
    "Masala Grilled Fish": "Fish coated in aromatic masala and grilled for a smoky, gently charred finish.",
    "Meen Manga Curry": "Fish and green mango simmered in a tangy, coconut-rich Kerala curry.",
    "Meen Moilee": "Fish gently cooked in a mild coconut sauce with ginger and curry leaves.",
    "Prawn Moilee": "Prawns gently simmered in a golden coconut sauce with ginger and curry leaves.",
    "Fish Pollichathu": "Spiced fish cooked in the Kerala pollichathu style for a fragrant, full-flavoured plate.",
  },
  dosa: {
    "Thattu Dosa": "Soft, compact Kerala-style dosas served warm from the griddle.",
    "Ghee Roast": "A thin, crisp dosa roasted with ghee for a rich, golden finish.",
    "Masala Dosa": "A crisp dosa folded around a warmly spiced potato filling.",
    "Chicken Tikka Dosa": "A crisp dosa filled with smoky chicken tikka and aromatic spices.",
  },
  breads: {
    "Plain Naan": "Soft, pillowy naan baked fresh against the wall of the tandoor.",
    "Butter Naan": "Tandoor-baked naan brushed with butter for a rich, soft finish.",
    "Garlic Naan": "Soft naan baked with fragrant garlic and finished in the tandoor.",
    "Chilli Naan": "Tandoor-baked naan lifted with fresh chilli heat.",
    "Cheese Naan": "Soft naan filled with melted cheese and baked in the tandoor.",
    "Peshwari Naan": "Sweet naan filled with a fragrant blend of fruit and nuts.",
    "Keema Naan": "Tandoor-baked naan filled with warmly spiced minced meat.",
    "Tandoori Roti": "A light wholewheat flatbread baked against the tandoor wall.",
    "Kerala Porotta (2)": "Two flaky, layered Kerala flatbreads with a crisp, tender finish.",
    "Appam (3)": "Three soft, lacy rice pancakes with delicate, bowl-shaped centres.",
    "Idiyappam (3)": "Three delicate nests of steamed rice noodles, ideal with curry.",
    "Chapathi (2)": "Two soft wholewheat flatbreads cooked fresh on the griddle.",
    "Chips": "Golden chips, crisp outside and fluffy in the centre.",
  },
  rice: {
    "Plain Rice": "Steamed rice served light and fluffy alongside your choice of curry.",
    "Pilau Rice": "Basmati rice cooked with gentle spices for a fragrant finish.",
    "Coconut Rice": "Fragrant rice tossed with coconut for a softly sweet, savoury side.",
    "Ghee Rice": "Basmati rice enriched with aromatic ghee and gentle spices.",
    "Mushroom Pilau": "Fragrant pilau rice cooked with savoury mushrooms and spices.",
  },
  sundries: {
    "Poppadom": "A light, crisp poppadom to enjoy with chutneys and pickles.",
    "Mixed Pickle": "A punchy Indian pickle with sharp, salty and spiced notes.",
    "Mango Chutney": "A sweet and gently spiced mango chutney.",
    "Spiced Onion": "Fresh onion dressed with tomato and a lively blend of spices.",
    "Raita": "Cooling yoghurt with gentle seasoning to balance richer dishes.",
    "Pakora Sauce": "A smooth, tangy house-style sauce for pakora and snacks.",
    "Pickle Tray": "A selection of chutney, pickle and spiced onion for the table.",
  },
  "kids-menu": {
    "Chicken Chasni": "A child-sized chicken chasni with a mild, creamy sweet-and-tangy sauce.",
    "Chicken Korma": "A child-sized chicken korma in a mild, creamy sauce.",
    "Chicken Nuggets & Chips": "Crisp chicken nuggets served with golden chips.",
    "Fish Fingers & Chips": "Crisp fish fingers served with golden chips.",
    "Fish & Chips": "A child-sized portion of battered fish with golden chips.",
  },
  desserts: {
    "Palada Payasam": "A traditional Kerala milk pudding with soft rice ada and gentle sweetness.",
    "Malabar Coast Special Dessert": "The restaurant's rotating house dessert; ask the team for today's preparation.",
    "Ice Cream": "A cool, creamy scoop for a simple finish to the meal.",
  },
  "soft-drinks": {
    "Cola": "Classic cola served chilled.",
    "Cola Zero": "Zero-sugar cola served chilled.",
    "Diet Cola": "Diet cola served chilled.",
    "Pepsi Max": "Maximum-taste, no-sugar cola served chilled.",
    "Irn-Bru": "Scotland's distinctive sparkling soft drink, served chilled.",
    "Diet Irn-Bru": "The low-sugar version of Scotland's distinctive sparkling soft drink.",
    "Tango": "A bright, fruity sparkling soft drink served chilled.",
    "Lemonade": "Crisp sparkling lemonade served chilled.",
    "Mango Soda": "A sparkling mango drink with a bright tropical finish.",
    "Lime Soda": "A refreshing sparkling lime drink served chilled.",
    "Mango Juice": "Smooth mango juice with a rich tropical flavour.",
    "Tender Coconut Water": "Light, refreshing coconut water served chilled.",
    "Fruit Shoot": "A child-friendly fruit drink served chilled.",
  },
  "tea-coffee": {
    "Tea": "A freshly brewed cup of classic tea.",
    "Black Tea": "Freshly brewed black tea served without milk.",
    "Coffee": "Freshly prepared coffee served hot.",
    "Masala Chai": "Indian tea brewed with milk and warming aromatic spices.",
    "Boost": "A warm malted chocolate drink made for a comforting finish.",
    "Horlicks": "A warm, gently sweet malted drink.",
  },
  "bottled-beer-cider": {
    "Kingfisher": "A crisp Indian lager served chilled by the bottle.",
    "Cobra": "A smooth lager created to complement spiced food, served chilled.",
    "Corona": "A light Mexican lager served chilled by the bottle.",
    "Budweiser": "A classic American-style lager served chilled by the bottle.",
    "Peroni": "A crisp Italian lager served chilled by the bottle.",
    "Peroni Zero": "An alcohol-free Italian lager served chilled by the bottle.",
    "Madri Zero": "An alcohol-free lager served chilled by the bottle.",
    "Strongbow": "A crisp apple cider served chilled by the bottle.",
    "Magners": "An Irish apple cider served chilled by the bottle.",
  },
  mixers: {
    "Mixer with Spirit": "A standard mixer served alongside your chosen spirit.",
    "Premium Tonic / Bottled Mixer": "A premium bottled tonic or mixer for your chosen spirit.",
    "Soft Drink Mixer": "A soft-drink mixer served with your chosen spirit.",
  },
};

const curryStyleDescriptions: Array<[RegExp, (protein: string) => string]> = [
  [/^Traditional /, (protein) => `${protein} simmered in a comforting onion, tomato and house-spice curry.`],
  [/Tikka Masala$/, () => "Tandoor-cooked chicken tikka folded through a smooth, warmly spiced tomato sauce."],
  [/^Butter Chicken$/, () => "Tender chicken simmered in a buttery tomato sauce with a mellow, creamy finish."],
  [/Chasni$/, (protein) => `${protein} cooked in a creamy sauce balanced with sweet and tangy notes.`],
  [/Mughlai Korma$/, () => "Tender chicken in a mild, creamy Mughlai-style sauce with aromatic spices."],
  [/Bhuna$/, (protein) => `${protein} cooked in a reduced onion and tomato masala for a rich, concentrated flavour.`],
  [/Jalfrezi$/, (protein) => `${protein} stir-cooked with peppers, onion, tomato and lively spices.`],
  [/Dopiaza$/, (protein) => `${protein} cooked with onions added in two stages for sweetness and texture.`],
  [/Kadai$/, (protein) => `${protein} cooked with peppers, tomato and freshly crushed kadai spices.`],
  [/Indian Garlic Chilli/, (protein) => `${protein} cooked in a bold garlic and chilli sauce with aromatic spices.`],
  [/Dragon Chicken$/, () => "Crisp chicken tossed through a bold, sweet, tangy and chilli-led sauce."],
  [/Malaidar/, (protein) => `${protein} finished in a smooth, creamy sauce with gentle aromatic spices.`],
];

function fallbackMenuDescription(category: string, name: string, subheading?: string) {
  const exact = menuDescriptionByCategory[category]?.[name];
  if (exact) return exact;
  if (["chicken", "beef", "lamb"].includes(category)) {
    const protein = `${category[0].toUpperCase()}${category.slice(1)}`;
    const style = curryStyleDescriptions.find(([pattern]) => pattern.test(name));
    if (style) return style[1](protein);
  }
  if (category === "biriyani") return `Fragrant basmati rice layered with spiced ${name.toLowerCase()} and slow-cooked together in the dum style.`;
  if (category === "draught-beer") {
    if (name === "Toddy") return "A traditional palm-inspired drink from the bar selection; ask the team for serving details.";
    const serve = name.endsWith(" Half") ? "half-pint" : "pint";
    return `${name.replace(/ (Half|Pint)$/, "")} served as a chilled ${serve} from the tap.`;
  }
  if (category === "spirits") return `${name} from our ${subheading?.toLowerCase() || "spirit"} selection, served by the measure.`;
  if (category === "wine") {
    if (subheading === "Prosecco") return "A bottle of sparkling prosecco from the bar selection.";
    return `House wine served as ${name === "Bottle" ? "a full bottle" : `a ${name} glass`}.`;
  }
  return `${name} from the Malabar Coast ${category.replace(/-/g, " ")} selection.`;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const romanNumerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"];

export const menuCategories: MenuCategory[] = definitions.map((category, index) => ({
  slug: category.slug,
  number: romanNumerals[index],
  title: category.title,
  note: category.note,
  description: category.description,
  orderRank: index,
}));

export const categoryDetails = Object.fromEntries(menuCategories.map((category) => [category.slug, category])) as Record<string, MenuCategory>;

export const menuItems: MenuItem[] = definitions.flatMap((category) =>
  category.items.map(([name, pricePence, options = {}], displayOrder) => {
    const dietaryStatus: DietaryStatus = options.dietaryStatus ?? (options.vegan ? "vegan" : options.vegetarian ? "vegetarian" : "nonVegetarian");
    const idSuffix = slugify(`${options.subheading ? `${options.subheading}-` : ""}${name}`);
    const isAlcoholic = options.alcoholic ?? false;
    return {
      id: `${category.slug}-${idSuffix}`,
      category: category.slug,
      name,
      description: options.description ?? fallbackMenuDescription(category.slug, name, options.subheading),
      subheading: options.subheading,
      pricePence,
      priceLabel: isAlcoholic ? "Ask the coast crew" : undefined,
      hidePrice: isAlcoholic,
      isAlcoholic,
      dietaryStatus: isAlcoholic ? "notApplicable" : dietaryStatus,
      dietaryReviewStatus: "needs-review",
      dietary: dietaryStatus === "vegan" ? ["VG"] : dietaryStatus === "vegetarian" ? ["V"] : [],
      allergens: [],
      spice: "None",
      available: true,
      onlineOrdering: options.orderable ?? (!isAlcoholic && pricePence !== null),
      featured: options.featured ?? false,
      displayOrder,
    };
  }),
);

export function getMenuItem(id: string) {
  return menuItems.find((menuItem) => menuItem.id === id);
}

export function formatPrice(pence: number | null, fallback = "Ask the coast crew") {
  if (pence === null) return fallback;
  return new Intl.NumberFormat("en-GB", {style: "currency", currency: "GBP"}).format(pence / 100);
}
