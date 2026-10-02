(function (SC) {
  "use strict";

  const categories = [
    { id: "semua", label: "Semua" },
    { id: "makanan", label: "Makanan" },
    { id: "minuman", label: "Minuman" },
    { id: "snack", label: "Snack" },
  ];

  const products = [
    {
      id: "food-01",
      name: "Nasi Goreng Spesial",
      category: "makanan",
      price: 12000,
      sold: 268,
      available: true,
      description:
        "Nasi goreng kampung dengan telur mata sapi, kerupuk, dan acar timun segar.",
    },
    {
      id: "food-02",
      name: "Mie Goreng Jawa",
      category: "makanan",
      price: 10000,
      sold: 241,
      available: true,
      description:
        "Mie goreng basah bumbu bawang putih dengan telur, sawi, dan irisan ayam.",
    },
    {
      id: "food-03",
      name: "Ayam Geprek Sambal Bawang",
      category: "makanan",
      price: 13000,
      sold: 312,
      available: true,
      description:
        "Ayam goreng tepung digeprek bersama sambal bawang, disajikan dengan nasi hangat.",
    },
    {
      id: "food-04",
      name: "Bakso Urat Kuah",
      category: "makanan",
      price: 12000,
      sold: 187,
      available: true,
      description:
        "Lima butir bakso urat dalam kuah kaldu sapi, mi kuning, dan taburan seledri.",
    },
    {
      id: "food-05",
      name: "Nasi Uduk Komplit",
      category: "makanan",
      price: 11000,
      sold: 143,
      available: true,
      description:
        "Nasi uduk gurih dengan bihun goreng, tempe orek, dan sambal kacang.",
    },
    {
      id: "food-06",
      name: "Sate Ayam Madura",
      category: "makanan",
      price: 14000,
      sold: 96,
      available: false,
      description:
        "Sepuluh tusuk sate ayam dengan bumbu kacang, lontong, dan bawang goreng.",
    },
    {
      id: "drink-01",
      name: "Es Teh Manis",
      category: "minuman",
      price: 4000,
      sold: 412,
      available: true,
      description: "Teh tubruk diseduh pekat, disajikan dingin dengan es batu.",
    },
    {
      id: "drink-02",
      name: "Es Jeruk Peras",
      category: "minuman",
      price: 5000,
      sold: 224,
      available: true,
      description: "Jeruk peras segar dengan gula batu dan es serut.",
    },
    {
      id: "drink-03",
      name: "Es Campur",
      category: "minuman",
      price: 8000,
      sold: 118,
      available: true,
      description:
        "Serutan es dengan cincau, kelapa muda, kolang-kaling, dan sirup gula merah.",
    },
    {
      id: "drink-04",
      name: "Air Mineral Dingin",
      category: "minuman",
      price: 3000,
      sold: 356,
      available: true,
      description: "Air mineral botol 600 ml, disimpan di lemari pendingin.",
    },
    {
      id: "drink-05",
      name: "Kopi Susu Gula Aren",
      category: "minuman",
      price: 9000,
      sold: 88,
      available: true,
      description: "Espresso dengan susu segar dan gula aren cair.",
    },
    {
      id: "snack-01",
      name: "Pisang Goreng Keju",
      category: "snack",
      price: 6000,
      sold: 174,
      available: true,
      description:
        "Dua potong pisang goreng dengan topping keju parut dan susu kental manis.",
    },
    {
      id: "snack-02",
      name: "Tahu Isi Sayur",
      category: "snack",
      price: 4000,
      sold: 152,
      available: true,
      description: "Tiga buah tahu isi sayur goreng, disajikan dengan cabai rawit.",
    },
    {
      id: "snack-03",
      name: "Risoles Mayo",
      category: "snack",
      price: 7000,
      sold: 103,
      available: true,
      description: "Risoles isi smoked beef, telur rebus, dan mayones.",
    },
    {
      id: "snack-04",
      name: "Keripik Singkong Balado",
      category: "snack",
      price: 5000,
      sold: 91,
      available: true,
      description: "Keripik singkong iris tipis dengan bumbu balado kering.",
    },
  ];

  const byIdMap = new Map(products.map((product) => [product.id, product]));

  const codeMap = new Map(
    products.map((product, index) => [product.id, String(index + 1).padStart(2, "0")])
  );

  const bestSellers = new Set(
    products
      .slice()
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 3)
      .map((product) => product.id)
  );

  const sorters = {
    populer: (a, b) => b.sold - a.sold || a.name.localeCompare(b.name, "id"),
    murah: (a, b) => a.price - b.price || a.name.localeCompare(b.name, "id"),
    mahal: (a, b) => b.price - a.price || a.name.localeCompare(b.name, "id"),
    nama: (a, b) => a.name.localeCompare(b.name, "id"),
  };

  function byId(id) {
    return byIdMap.get(id) || null;
  }

  function code(id) {
    return codeMap.get(id) || "00";
  }

  function isBestSeller(id) {
    return bestSellers.has(id);
  }

  function categoryOf(id) {
    return categories.find((category) => category.id === id) || categories[0];
  }

  function list(options) {
    const { category = "semua", query = "", sort = "populer" } = options || {};
    const keyword = query.trim().toLowerCase();
    const sorter = sorters[sort] || sorters.populer;

    return products
      .filter((product) => {
        if (category !== "semua" && product.category !== category) return false;
        if (!keyword) return true;
        return `${product.name} ${product.description}`.toLowerCase().includes(keyword);
      })
      .sort(sorter);
  }

  SC.data = { products, categories, byId, code, isBestSeller, categoryOf, list };
})(window.SC || (window.SC = {}));
