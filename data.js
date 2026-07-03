const CITIES = ["Томск", "Москва", "Санкт-Петербург"];

const FORMAT_LABELS = {
    group: "Групповая",
    individual: "Индивидуальная",
    self: "Самостоятельная",
};

const MOVE_LABELS = {
    walk: "Пешком",
    bus: "Автобусом",
    car: "На автомобилях группы",
};

const PLACEHOLDER_IMG =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(`
  <svg xmlns='http://www.w3.org/2000/svg' width='400' height='280'>
    <rect width='400' height='280' fill='#EDE7D8'/>
    <text x='200' y='145' font-family='monospace' font-size='14' fill='#8A8578' text-anchor='middle'>фото не загружено</text>
  </svg>`);

const SEED_TOURS = [
    {
        id: "t1",
        title: "Деревянный Томск: наличники и легенды",
        city: "Томск",
        district: "Центр",
        country: "Россия",
        photos: [],
        shortDesc: "Прогулка по резным особнякам старого города с местным архитектором.",
        fullDesc:
            "Пройдём по улицам Кузнечный взвоз, Розы Люксембург и Октябрьской, разберём разницу между сибирским барокко и модерном на наличниках, зайдём во двор к действующему резчику по дереву. Экскурсию ведёт местный житель, изучающий деревянное зодчество 8 лет.",
        format: "group",
        groupSize: 12,
        kidsAllowed: true,
        move: "walk",
        duration: 120,
        priceType: "person",
        price: 900,
        author: { name: "Ирина Соснина", contact: "irina.tomsk@example.com" },
        slots: ["2026-07-10T11:00", "2026-07-10T15:00", "2026-07-12T11:00"],
    },
    {
        id: "t2",
        title: "Индивидуальный гастротур по рынкам Томска",
        city: "Томск",
        district: "Черемошники",
        country: "Россия",
        photos: [],
        shortDesc: "Дегустация сибирских продуктов, только для вас — в удобное время.",
        fullDesc:
            "Индивидуальная экскурсия для тех, кто хочет попробовать настоящую сибирскую кухню: кедровые орехи, таёжный мёд, копчёная рыба. Гид — шеф-повар с опытом работы в местных ресторанах, подстроится под ваш темп и интересы.",
        format: "individual",
        groupSize: null,
        kidsAllowed: true,
        move: "walk",
        duration: 90,
        priceType: "group",
        price: 4500,
        author: { name: "Максим Дорофеев", contact: "maxim.food@example.com" },
        slots: ["2026-07-09T10:00", "2026-07-11T10:00"],
    },
    {
        id: "t3",
        title: "Аудиомаршрут: Красная площадь и окрестности",
        city: "Москва",
        district: "Центр",
        country: "Россия",
        photos: [],
        shortDesc: "Самостоятельная прогулка с аудиогидом от москвича в третьем поколении.",
        fullDesc:
            "Скачайте аудиогид и идите в своём темпе — от Красной площади до Замоскворечья. В маршруте — истории про доходные дома, купеческие лавки и подвалы НКВД, рассказанные без пафоса, простым языком.",
        format: "self",
        groupSize: null,
        kidsAllowed: true,
        move: "walk",
        duration: 150,
        priceType: "person",
        price: 350,
        author: { name: "Пётр Валов", contact: "petr.walks@example.com" },
        slots: [],
    },
    {
        id: "t4",
        title: "Ночная Москва на автомобилях",
        city: "Москва",
        district: "Центр — Сити",
        country: "Россия",
        photos: [],
        shortDesc: "Групповой автотур по подсвеченным набережным и высоткам.",
        fullDesc:
            "Едем на нескольких автомобилях группы (можно присоединиться на своей машине или без неё) по семи сталинским высоткам, Москва-Сити и Воробьёвым горам. Финал — смотровая площадка с видом на весь город.",
        format: "group",
        groupSize: 6,
        kidsAllowed: false,
        move: "car",
        duration: 180,
        priceType: "person",
        price: 2200,
        author: { name: "Артём Голиков", contact: "artem.night@example.com" },
        slots: ["2026-07-10T21:00", "2026-07-11T21:00"],
    },
    {
        id: "t5",
        title: "Дворы и подворотни Петроградки",
        city: "Санкт-Петербург",
        district: "Петроградский район",
        country: "Россия",
        photos: [],
        shortDesc: "Маленькая группа, закрытые дворы, истории коммуналок.",
        fullDesc:
            "Гуляем по проходным дворам Петроградской стороны, куда не водят большие группы. Гид — коренная петербурженка, расскажет про быт коммунальных квартир и покажет модерн изнутри дворов.",
        format: "group",
        groupSize: 8,
        kidsAllowed: true,
        move: "walk",
        duration: 100,
        priceType: "person",
        price: 800,
        author: { name: "Анна Летова", contact: "anna.spb@example.com" },
        slots: ["2026-07-09T12:00", "2026-07-09T16:00", "2026-07-13T12:00"],
    },
    {
        id: "t6",
        title: "Индивидуальная экскурсия на катере по каналам",
        city: "Санкт-Петербург",
        district: "Центр",
        country: "Россия",
        photos: [],
        shortDesc: "Частный катер, гид только для вашей компании.",
        fullDesc:
            "Личный катер и гид-историк на два часа — маршрут подстраивается под ваши интересы: архитектура, разводные мосты или тихие каналы без туристов. Подходит для семей с детьми.",
        format: "individual",
        groupSize: null,
        kidsAllowed: true,
        move: "bus",
        duration: 120,
        priceType: "group",
        price: 12000,
        author: { name: "Сергей Нартов", contact: "sergey.boats@example.com" },
        slots: ["2026-07-10T09:00", "2026-07-10T13:00", "2026-07-12T09:00"],
    },
];