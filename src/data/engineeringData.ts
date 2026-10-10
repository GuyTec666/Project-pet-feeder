export interface EngineeringPart {
  id: string;
  nameTh: string;
  nameEn: string;
  category: 'mechanical' | 'actuator' | 'sensor' | 'controller' | 'power';
  quantity: number;
  unitPriceThb: number;
  totalPriceThb: number;
  specSummary: string;
  roleInProject: string;
  engineeringDetails: string[];
  pdfReference: string;
  externalStandardRef: {
    title: string;
    citation: string;
    engineeringNote: string;
  };
  cameraTarget: [number, number, number];
  cameraPosition: [number, number, number];
}

export interface PaddleDesignExample {
  id: 'paddle' | 'carousel' | 'auger';
  badge: string;
  titleTh: string;
  titleEn: string;
  recommended: boolean;
  commercialExample: string;
  howItWorks: string;
  whyGoodFor775: string;
  pros: string[];
  cons: string[];
  diyFabricationSteps: string[];
  dimensionsSpec: {
    label: string;
    value: string;
  }[];
}

export const PADDLE_DESIGN_EXAMPLES: PaddleDesignExample[] = [
  {
    id: 'paddle',
    badge: 'ตัวอย่างที่ 1 · แนะนำที่สุด (ทำง่าย & ไม่ติดขัด 100%)',
    titleTh: 'ใบพัดกังหันตักอาหารแนวตั้ง 6 แฉก (Vertical Rotary Star / Paddle Wheel)',
    titleEn: 'Vertical-Plane 6-Vane Flexible Silicone Star Feeder (Airlock Rotary Valve)',
    recommended: true,
    commercialExample:
      'ต้นแบบจากเครื่องให้อาหารสัตว์อัตโนมัติเชิงพาณิชย์ (เช่น PetSafe / Xiaomi Pet Feeder) และตู้กดซีเรียลในโรงแรม (Cereal Dispenser)',
    howItWorks:
      'วางห้องกังหันทรงกระบอกคั่นกลางระหว่าง "ก้นถังพักอาหารด้านบน" กับ "ปากทางเข้ารางแยก Y-Splitter ด้านล่าง" เมื่อมอเตอร์ 775 หมุน แกนใบพัดยาง 6 แฉกจะตักอาหารเม็ดจากด้านบน หมุนอ้อมลงมาเททิ้งลงสู่ยอดรางแยก Y-Splitter ด้านล่างทีละช่องอย่างต่อเนื่อง และเมื่อ Relay ตัดไฟหยุดมอเตอร์ ใบพัดแฉกที่ขวางอยู่จะทำหน้าที่เป็นประตูกั้น (Airlock Seal) ไม่ให้อาหารไหลรั่วลงมาเอง',
    whyGoodFor775:
      'ใช้ระยะท่อสั้นมาก (หนาแค่ 7–8 ซม.) ไม่ต้องกลึงเกลียวสว่านยาวๆ และเนื่องจากใช้ใบพัดยางซิลิโคน (หรือแผ่นพลาสติก PP อ่อน) เม็ดอาหารจึงไม่เคยเข้าไปขัดจนมอเตอร์ค้าง',
    pros: [
      'ไม่ต้องหาซื้อหรือพิมพ์เกลียวสว่าน 3D: สร้างเองได้ง่ายมากจากท่อ PVC 4 นิ้ว และแผ่นยางซิลิโคน',
      'กันอาหารไหลรั่วเอง 100% (Self-Sealing): เมื่อมอเตอร์ 775 หยุดหมุน ใบพัดจะกั้นช่องทางเดินอาหารไว้สนิท ไม่เกิดปัญหาอาหารไหลทะลักเหมือนเกลียวแนวตั้ง',
      'ไม่บดเม็ดอาหารแตก: ใบพัดยางซิลิโคนจะโค้งงอตัวเมื่อเจอเม็ดอาหารที่ขวางขอบท่อ (Zero-Jamming)',
      'ปล่อยอาหารลงตรงจุดกึ่งกลางรางแยก 2 ทาง (Y-Splitter) พอดี ทำให้ชามซ้ายและขวาได้น้ำหนักเท่ากัน'
    ],
    cons: [
      'มอเตอร์ 775 เดิมๆ หมุนเร็ว (3,000+ RPM) จึงควรลดไฟเลี้ยงลงเหลือ ~9V–12V หรือต่อหัวเกียร์ทดรอบให้กังหันหมุนที่ประมาณ 30–60 รอบ/นาที (RPM) เพื่อตักอาหารลงอย่างนุ่มนวล'
    ],
    diyFabricationSteps: [
      '1. เสื้อห้องกังหัน (Cylindrical Chamber): ใช้ท่อ PVC ขนาด 4 นิ้ว (Ø100–110 มม.) ตัดความยาวแค่ 75 มม. เจาะช่องด้านบน (12 นาฬิกา) ให้รับอาหารจากถังพัก และเจาะช่องด้านล่าง (6 นาฬิกา) ให้ตรงกับปากกรวยรางแยก Y-Splitter',
      '2. แกนกลางใบพัด (Rotor Hub): ใช้ท่อ PVC 6 หุน หรือท่อตัน ยาว 70 มม. ยึดกับเพลามอเตอร์ 775 (Ø5mm) ด้วยข้อต่อหน้าแปลนเหล็ก (5mm Flange Shaft Coupler)',
      '3. ใบพัดตักอาหาร 6 แฉก (Flexible Vanes): ตัดแผ่นยางซิลิโคน Food-Grade (หาซื้อได้จาก "แผ่นพายซิลิโคนทำขนม" หรือ "แผ่นรองนวดแป้งซิลิโคนหนา 2–3 มม.") ขนาดกว้าง 70 มม. × ยาว 38 มม. จำนวน 6 แผ่น ยึดติดรอบแกนกลางให้ห่างกันแฉกละ 60°',
      '4. ปรับขอบกันเม็ดอาหารหนีบ: ที่ขอบปากช่องด้านบน ให้แปะขอบยางนิ่มหรือปาดมุมเฉียง 45° เวลาใบพัดหมุนกวาดผ่าน เม็ดอาหารจะเด้งเข้าช่องตักโดยไม่ขัดค้าง'
    ],
    dimensionsSpec: [
      { label: 'ขนาดเสื้อห้องกังหัน (Housing ID)', value: 'Ø100 mm (ท่อ PVC 4 นิ้ว ยาว 75 mm)' },
      { label: 'ขนาดแกนกลาง + ใบพัด 6 แฉก', value: 'แกน Ø25 mm + ใบยางซิลิโคนยาวแฉกละ 37 mm' },
      { label: 'ปริมาตรตวงต่อ 1 ช่องใบพัด', value: '~25–30 กรัม/ช่อง (หมุน 3 รอบได้ ~500 กรัม)' },
      { label: 'ข้อต่อเพลามอเตอร์ 775', value: '5mm Rigid Flange Coupler ยึดหลังแกนกังหัน' }
    ]
  },
  {
    id: 'carousel',
    badge: 'ตัวอย่างที่ 2 · กังหันจานหมุนแนวราบ (สำหรับวางมอเตอร์แนวตั้ง)',
    titleTh: 'กังหันช่องตักแนวราบ (Horizontal Carousel / Sweeper Wheel)',
    titleEn: 'Horizontal-Plane Rotary Pocket Carousel under Hopper',
    recommended: false,
    commercialExample:
      'ต้นแบบจากเครื่องให้อาหารปลาในฟาร์ม และเครื่องตวงเมล็ดพืชแบบจานหมุน (Rotary Table / Pocket Dosimeter)',
    howItWorks:
      'หากคุณต้องการวางมอเตอร์ 775 ใน "แนวตั้ง" สามารถใช้กังหัน 6 ช่องวางขนานกับพื้นใต้ก้นถังพัก โดยเจาะรูรับอาหารจากถังด้านบนไว้ที่ฝั่งซ้าย (ตำแหน่ง 9 นาฬิกา) และเจาะรูปล่อยอาหารลงรางแยก Y-Splitter ไว้ที่ฝั่งขวา (ตำแหน่ง 3 นาฬิกา) เมื่อกังหันหมุน ช่องใบพัดจะรับอาหารจากฝั่งหนึ่งแล้วหมุนกวาดไปเทลงรูอีกฝั่งหนึ่ง',
    whyGoodFor775:
      'แก้ปัญหาอาหารไหลทะลักเองของการวางแนวตั้งได้ 100% เพราะรูทางเข้าด้านบนกับรูทางออกด้านล่างอยู่เยื้องคนละฝั่งกัน (Offset Inlet/Outlet) อาหารจะลงได้เฉพาะตอนใบพัดหมุนพาไปเท่านั้น',
    pros: [
      'วางมอเตอร์ 775 ในแนวตั้งได้โดยที่อาหารไม่ไหลทะลักลงมาเองตอนตัดไฟ Relay',
      'น้ำหนักอาหารในถังพักกดลงบนแผ่นพื้นห้องกังหัน ไม่ได้กดลงบนรูปล่อยอาหารโดยตรง'
    ],
    cons: [
      'ต้องทำแผ่นปิดด้านบนและด้านล่างของห้องกังหันเพื่อเจาะรูเยื้องกัน (Offset Holes) ซึ่งมีชิ้นส่วนมากกว่าแบบที่ 1 เล็กน้อย'
    ],
    diyFabricationSteps: [
      '1. ใช้กล่องพลาสติกกลมก้นแบน (หรือฝาครอบท่อ PVC 4 นิ้วประกบกัน) เจาะรูแผ่นบนที่ฝั่งซ้าย และเจาะรูแผ่นล่างที่ฝั่งขวาให้ตรงกับรางแยก Y-Splitter',
      '2. สร้างใบพัด 6 แฉกหมุนกวาดในแนวราบ เมื่อมอเตอร์ 775 หมุน ใบพัดจะกวาดอาหารจากรูบนไปตกลงรูล่าง'
    ],
    dimensionsSpec: [
      { label: 'ขนาดจานกังหันแนวราบ', value: 'Ø110 mm สูง 45 mm' },
      { label: 'การจัดวางรูเข้า-ออก', value: 'เยื้องกัน 180° (Inlet ซ้าย / Outlet ขวา)' },
      { label: 'การวางเพลามอเตอร์ 775', value: 'วางตั้งฉากแนวดิ่ง (Vertical Shaft)' },
      { label: 'การป้องกันอาหารรั่ว', value: 'กั้นด้วยมุมเยื้อง 180° (ไม่รั่วไหลเอง 100%)' }
    ]
  },
  {
    id: 'auger',
    badge: 'ตัวอย่างที่ 3 · แบบเกลียวลำเลียงเดิม (เพื่อเปรียบเทียบ)',
    titleTh: 'เกลียวลำเลียงแนวนอน (Horizontal Archimedes Screw Auger)',
    titleEn: 'Horizontal Screw Conveyor in Ø65mm PVC Tube',
    recommended: false,
    commercialExample: 'ต้นแบบจากไซโลลำเลียงอาหารสัตว์ในฟาร์มอุตสาหกรรม',
    howItWorks:
      'ใช้ใบเกลียวสว่านหมุนดันอาหารไปตามท่อแนวนอนออกสู่ปากทางเข้ารางแยก Y-Splitter',
    whyGoodFor775:
      'จ่ายอาหารได้ต่อเนื่อง แต่ทำยากกว่าใบพัดกังหันเพราะต้องหาดอกสว่านหรือขึ้นรูปใบเกลียวให้ได้ศูนย์กลาง',
    pros: [
      'การไหลของอาหารสม่ำเสมอต่อเนื่องตลอดเวลาที่เกลียวหมุน',
      'ส่งอาหารยื่นออกไปด้านหน้าเข้าสู่รางแยก Y-Splitter ได้โดยตรง'
    ],
    cons: [
      'สร้างใบเกลียวเองยากกว่าแบบใบพัดกังหันตักอาหาร',
      'หากเม็ดอาหารใหญ่และระยะห่างขอบท่อน้อย อาจเกิดอาการเม็ดอาหารขัดกับขอบท่อได้'
    ],
    diyFabricationSteps: [
      '1. ใช้ท่อ PVC 2.5 นิ้ว เป็นเสื้อท่อ และใช้ดอกสว่านเจาะดิน Ø58mm หรือใบเกลียวพลาสติกต่อกับเพลามอเตอร์ 775'
    ],
    dimensionsSpec: [
      { label: 'ขนาดท่อลำเลียง', value: 'Ø65 mm (ท่อ PVC 2.5 นิ้ว)' },
      { label: 'ขนาดใบเกลียว', value: 'Ø58 mm พิทช์ 48 mm' },
      { label: 'การวางเพลามอเตอร์ 775', value: 'แนวนอน (Horizontal Shaft)' },
      { label: 'ความยากในการสร้างเอง', value: 'ปานกลาง–ยาก (ต้องตั้งศูนย์เกลียว)' }
    ]
  }
];

export const ENGINEERING_PARTS: EngineeringPart[] = [
  {
    id: 'single-hopper',
    nameTh: 'ถังพักอาหารเดี่ยวขนาดใหญ่ + กรวยบังคับไหล (Single Central Food-Grade PP Hopper)',
    nameEn: 'Single High-Capacity Food-Grade PP Hopper with 45° Mass-Flow Funnel',
    category: 'mechanical',
    quantity: 1,
    unitPriceThb: 65,
    totalPriceThb: 65,
    specSummary: 'Food-Grade PP (BPA-Free) · ถังเดี่ยวจุอาหารรวม · กรวย 45° ลงสู่ห้องใบพัดกังหัน',
    roleInProject:
      'ใช้ถังพักอาหารเดี่ยวตรงกลางตัวเครื่องเพื่อประหยัดต้นทุนโครงสร้าง เติมอาหารจุดเดียว แล้วปล่อยลงสู่ห้องใบพัดกังหันตักอาหารด้านล่าง',
    engineeringDetails: [
      'ถังพักอาหารเดี่ยวตรงกลางตัวเครื่อง ทำจากพลาสติก Food-Grade Polypropylene (PP) ปราศจากสาร BPA ตามแนวคิด Pet-Centered Design (บทที่ 2 หัวข้อ 2.2.2.1)',
      'ก้นถังเป็นกรวยทำมุมเอียง 45° บังคับให้อาหารเม็ดไหลลงสู่ช่องรับด้านบนของห้องใบพัดกังหัน (Rotary Paddle Chamber) อย่างทั่วถึงโดยไม่ค้างก้นถัง',
      'ขอบปากทางเข้าห้องใบพัดออกแบบให้ปาดมุมเฉียง 45° พร้อมแผ่นยางปาดหน้า (Anti-Pinch Wiper Lip) เพื่อป้องกันเม็ดอาหารเข้าไปหนีบระหว่างปลายใบพัดกับขอบถัง'
    ],
    pdfReference:
      'บทที่ 1 (ขอบเขตข้อ 4: ใช้สำหรับ 1 ฟาร์ม แนะนำ 2–4 ตัว มีสองทางส่งอาหารเม็ด) & บทที่ 2 (2.2.2.1 วัสดุ Food-Grade BPA-Free)',
    externalStandardRef: {
      title: 'Jenike, A. W. (1964). Storage and Flow of Solids, Bulletin 123, University of Utah.',
      citation:
        'มุมพักตัว (Angle of Repose) ของอาหารเม็ดสุนัขอยู่ที่ 32°–37° การใช้กรวยถังพักทำมุม 45° ลงสู่ช่องตักของใบพัดกังหันช่วยให้เม็ดอาหารไหลเติมลงช่องใบพัดได้เต็มทุกช่องโดยไม่เกิดโพรงอากาศ',
      engineeringNote: 'มองเห็นระดับอาหารได้จากช่องใสบนฝาถังพักและด้านหน้าตัวเครื่อง'
    },
    cameraTarget: [0, 2.35, -0.35],
    cameraPosition: [3.1, 3.3, 3.6]
  },
  {
    id: 'motor-775-auger',
    nameTh: 'มอเตอร์ DC 775 แรงบิดสูง (12–36V) + ชุดใบพัดกังหันตักอาหาร 6 แฉก (Rotary Paddle Wheel)',
    nameEn: 'High-Torque 775 DC Motor (12–36V) & 6-Vane Flexible Silicone Rotary Star Feeder',
    category: 'actuator',
    quantity: 1,
    unitPriceThb: 220,
    totalPriceThb: 220,
    specSummary: 'DC 12V–36V · ข้อต่อเพลา 5mm · ใบพัดยางซิลิโคน 6 แฉก ในเสื้อท่อ PVC Ø100mm',
    roleInProject:
      'ใช้มอเตอร์ 775 เพียงตัวเดียว หมุนใบพัดกังหัน 6 แฉกเพื่อตักอาหารเม็ดจากก้นถังพักลงสู่รางแยก 2 ทาง (Y-Splitter) โดยไม่ติดขัดและไม่รั่วไหลเองเมื่อมอเตอร์หยุด',
    engineeringDetails: [
      'เปลี่ยนจากเกลียวสว่านที่ทำยาก มาใช้ "ใบพัดกังหันตักอาหาร 6 แฉก (Rotary Star / Paddle Wheel)" ซึ่งสร้างเองได้ง่ายมากและแก้ปัญหาอาหารติดขัดได้ 100%',
      'ตัวใบพัด 6 แฉกทำจากแผ่นยางซิลิโคน Food-Grade หนา 2.5–3 มม. ยึดกับแกนกลางในเสื้อท่อ PVC ขนาด 4 นิ้ว (Ø100 มม.) เมื่อหมุนเจอเม็ดอาหารที่ขวางอยู่ แผ่นยางจะให้ตัวได้เล็กน้อยทำให้มอเตอร์ 775 ไม่เคยค้างหรือบดอาหารแตก',
      'ทำหน้าที่เป็นวาล์วกั้นอาหารในตัว (Rotary Airlock Valve): เมื่อน้ำหนักในชามแตะ 440–480 กรัม แล้ว Relay สั่งตัดสาย Ground (N) หยุดมอเตอร์ 775 ใบพัดแฉกที่ขวางอยู่จะปิดกั้นช่องทางเดินอาหารทันที เม็ดอาหารจึงไม่ไหลทะลักลงมาเอง',
      'เพลามอเตอร์ 775 (Ø5mm) ต่อตรงเข้ากับแกนกลางกังหันด้วยข้อต่อหน้าแปลนเหล็ก (5mm Flange Shaft Coupler) แข็งแรงทนทาน'
    ],
    pdfReference:
      'บทที่ 1 (ขอบเขตข้อ 2: ตั้งปริมาณ 500g ตัดจ่ายก่อนกำหนดที่ 440–480g) & บทที่ 2 (2.1.2.6 ส่วนขับเคลื่อน Actuator / DC Motor)',
    externalStandardRef: {
      title:
        'Mills, D. (2003). Pneumatic Conveying Design Guide — Chapter 4: Rotary Drop-Through Feeders & Airlock Valves, Butterworth-Heinemann.',
      citation:
        'กังหันตักจ่ายแบบ Drop-Through Rotary Star Feeder ที่มีจำนวนใบพัด 6–8 แฉก จะมีใบพัดอย่างน้อย 2 แฉกสัมผัสผนังห้องกังหันเสมอ ทำให้สามารถตวงปริมาตรต่อรอบ (Volumetric Pocket Metering) ได้แม่นยำและป้องกันการไหลทะลัก (Flushing) ได้สมบูรณ์',
      engineeringNote: 'สามารถกดสลับดูในโมเดล 3D ได้ทั้งแบบ "ใบพัดกังหันแนวตั้ง", "กังหันจานหมุนแนวราบ" และ "เกลียวลำเลียง"'
    },
    cameraTarget: [0, 1.52, -0.15],
    cameraPosition: [2.2, 1.85, 1.9]
  },
  {
    id: 'y-splitter-chute',
    nameTh: 'รางแยกส่งอาหาร 2 ทางทรงตัว Y (Dual-Way Y-Splitter Chute & Inspection Window)',
    nameEn: 'Symmetrical 40° Y-Splitter Bifurcated Chute with Center Dividing Fin',
    category: 'mechanical',
    quantity: 1,
    unitPriceThb: 350,
    totalPriceThb: 350,
    specSummary: 'ท่อแยก Y-Chute ทำมุมสโลป 40° · ครีบแบ่งกึ่งกลาง 50:50 · หน้าต่างอะคริลิกใส',
    roleInProject:
      'ตั้งอยู่ใต้ช่องเทของห้องใบพัดกังหัน เพื่อรับอาหารเม็ดที่กังหันตักลงมา แล้วแบ่งออกเป็น 2 ทางซ้าย-ขวาอย่างสมดุล (50:50) ไหลลงสู่ชามสแตนเลสทั้ง 2 ใบ',
    engineeringDetails: [
      'ใต้ช่องปล่อยอาหารของห้องใบพัดกังหัน (ตำแหน่ง 6 นาฬิกา) มีครีบสามเหลี่ยมแบ่งทิศทาง (Apex Splitter Fin) ทำหน้าที่แยกอาหารเม็ดที่ตกลงมาให้ออกไปทางรางซ้ายและรางขวาในสัดส่วน 50% : 50% เท่ากัน',
      'รางลำเลียงทั้งสองฝั่งลาดเอียงทำมุม 40° กับแนวราบ ช่วยให้อาหารเม็ดสไลด์ลงสู่จุดกึ่งกลางชามสแตนเลสทั้ง 2 ใบอย่างรวดเร็วโดยไม่ค้างในท่อ',
      'ด้านหน้าตัวเครื่องมีหน้าต่างอะคริลิกใส (Transparent Inspection Window) ให้มองเห็นการหมุนตักอาหารของใบพัดกังหันและการแยกตัวของอาหารเม็ดลงสู่ 2 ชามได้ชัดเจน'
    ],
    pdfReference:
      'บทที่ 1 (ขอบเขตข้อ 4: มีสองทางส่งอาหารเม็ด สำหรับสุนัข 2–4 ตัว) & บทที่ 3 (3.2 ข้อ 4: ออกแบบโครงสร้างตัวเครื่อง ถาดรองรับอาหาร 2 ทาง)',
    externalStandardRef: {
      title:
        'Roberts, A. W. (2003). Chute Design Considerations for Feeding and Transfer of Bulk Solids, Bulk Solids Handling.',
      citation:
        'รางแยกสองทาง (Bifurcated Y-Chute) ที่มีมุมเอียงราง 40° สูงกว่ามุมเสียดทานจลน์ของอาหารเม็ดบนพลาสติก (~28°) รับประกันการไหลแบบไม่ติดค้าง (Self-Cleaning Chute Flow)',
      engineeringNote: 'ครีบแบ่งตรงกลางช่วยให้ใช้กังหันตักอาหารเพียงชุดเดียวแต่จ่ายลง 2 ชามได้พร้อมกัน'
    },
    cameraTarget: [0, 1.05, 0.12],
    cameraPosition: [0, 1.55, 2.95]
  },
  {
    id: 'relay-buck-esp32',
    nameTh: 'ระบบควบคุม ESP32 + Relay Module (ตัดต่อฝั่ง GND/N) + Buck Converter + RTC DS3231',
    nameEn: 'ESP32 Node32s, Low-Side GND/N Relay Switching, Step-Down Buck Converter & RTC',
    category: 'controller',
    quantity: 1,
    unitPriceThb: 480,
    totalPriceThb: 480,
    specSummary: 'PSU 12–24V -> Buck Converter 5V · Relay ตัดต่อ GND/N มอเตอร์ 775 · ESP32 + RTC',
    roleInProject:
      'จ่ายไฟและควบคุมการทำงานทั้งหมด: แปลงไฟ 12–24V ลงเป็น 5V ด้วย Buck Converter เลี้ยงบอร์ด ESP32 และใช้ Relay Module สั่งเปิด-ปิดมอเตอร์ 775 โดยตัดต่อสายฝั่ง Ground (N)',
    engineeringDetails: [
      'แหล่งจ่ายไฟหลัก 12V–24V จ่ายไฟบวก (+V) เข้าขั้วมอเตอร์ 775 ส่วนสายฝั่งลบ (Ground / N ของมอเตอร์) ต่อผ่านหน้าสัมผัส COM และ NO ของโมดูลรีเลย์ (Relay Module) ลงสู่ GND ตามที่ออกแบบไว้',
      'ใช้โมดูลลดแรงดัน DC-DC Step-Down Buck Converter (เช่น LM2596) แปลงไฟจากชุด 12V–24V ลงมาเป็น 5.0V ที่เสถียร เพื่อจ่ายไฟเลี้ยงบอร์ด ESP32 Node32s, โมดูล HX711, โมดูล RTC DS3231, Buzzer และชุดคอยล์ของ Relay',
      'ต่อไดโอดกันไฟย้อน (Flyback Diode เช่น 1N5408) คร่อมขั้วมอเตอร์ 775 เพื่อสลายแรงดันกระชากย้อนกลับ (Back-EMF) ขณะ Relay สั่งตัดสาย Ground/N ป้องกันหน้าสัมผัสรีเลย์อาร์คและป้องกัน ESP32 รีเซ็ต'
    ],
    pdfReference:
      'บทที่ 1 (ขอบเขตข้อ 1: ตั้งเวลาผ่าน Telegram ใช้ ESP32) & บทที่ 2 (2.1.2.4 ส่วนประมวลผลกลาง ESP32, 2.7 Telegram Bot API)',
    externalStandardRef: {
      title:
        'Texas Instruments LM2596 Simple Switcher Power Converter Datasheet & Songle SRD-05VDC-SL-C Relay Application Note.',
      citation:
        'การตัดต่อมอเตอร์ DC แรงบิดสูงด้วย Relay ฝั่ง Low-Side (Ground/N Switching) ร่วมกับ Flyback Diode ช่วยป้องกันแรงดัน Inductive Spike ไม่ให้กวนระบบลอจิก 5V/3.3V ของไมโครคอนโทรลเลอร์',
      engineeringNote: 'กล่องควบคุมติดตั้งอยู่ด้านหลังตัวเครื่อง แยกห่างจากชามอาหารเพื่อความปลอดภัยและกันความชื้น'
    },
    cameraTarget: [0, 1.35, -0.95],
    cameraPosition: [-2.8, 2.0, -2.7]
  },
  {
    id: 'loadcell-hx711',
    nameTh: 'เซนเซอร์วัดน้ำหนัก Single-Point Load Cell (10KG) + โมดูล HX711 (แยก 2 ชาม)',
    nameEn: 'Dual 10kg Parallel-Beam Load Cells & HX711 24-Bit Sigma-Delta ADC Modules',
    category: 'sensor',
    quantity: 2,
    unitPriceThb: 102,
    totalPriceThb: 204,
    specSummary: 'Aluminum Alloy Parallel Beam 10KG × 2 ตัว · Full-Bridge Wheatstone · 24-Bit ADC',
    roleInProject:
      'ติดตั้งใต้ชามสแตนเลสทั้ง 2 ใบเพื่อวัดน้ำหนักอาหารเม็ดที่ไหลลงมาจากรางแยก 2 ทางแบบเรียลไทม์ และส่งค่าป้อนกลับ (Closed-Loop Feedback) ให้ ESP32 สั่งตัด Relay ทันทีที่ถึงพิกัด',
    engineeringDetails: [
      'คงการใช้ชาม 2 ใบพร้อม Load Cell 10KG แยกอิสระ 2 ตัวตามข้อกำหนด ทำให้สามารถตรวจสอบได้ทั้งน้ำหนักอาหารที่จ่ายลงแต่ละชาม และติดตามพฤติกรรมการกินของสุนัขแต่ละฝั่งผ่าน Telegram',
      'ใช้โครงสร้างคานขนาน (Single-Point Parallel Beam) พร้อมสเตรนเกจ 4 ตัวต่อแบบ Full-Bridge Wheatstone ชดเชยแรงกดไม่ลงจุดศูนย์กลางเมื่ออาหารสไลด์ลงมาจากรางแยก Y-Splitter',
      'เชื่อมต่อกับโมดูลขยายสัญญาณ HX711 ความละเอียด 24 บิต (Gain 128) ส่งข้อมูลดิจิทัลเข้าขา GPIO ของ ESP32'
    ],
    pdfReference:
      'บทที่ 2 (2.6 ทฤษฎีเซลล์โหลดและสเตรนเกจ, 2.6.3 วงจรบริดจ์วีทสโตน, 2.6.4.4 โมดูล HX711) & บทที่ 3 (3.3.1 แบ่งพื้นที่ทดสอบ 2 โซน ชั่งน้ำหนักแยกอิสระ)',
    externalStandardRef: {
      title: 'Hoffmann, K. (2012). An Introduction to Measurements using Strain Gauges & Avia HX711 Datasheet.',
      citation:
        'สมการ V_O = V_EX × [(R3/(R3+R4)) - (R2/(R1+R2))] และการเว้นระยะลอยตัว (Deflection Clearance 4mm) ใต้แป้นรับชามช่วยให้คานอะลูมิเนียมยุบตัวเชิงเส้นได้อย่างแม่นยำระดับกรัม',
      engineeringNote: 'เมื่อน้ำหนักเฉลี่ยแตะ 440–480 กรัม ESP32 จะสั่งตัด Relay มอเตอร์ 775 ทันที'
    },
    cameraTarget: [0, 0.25, 0.85],
    cameraPosition: [2.5, 0.72, 2.4]
  },
  {
    id: 'bowl-lock',
    nameTh: 'ชามสแตนเลสคู่ 2 ใบ พร้อมสลักล็อคถอดล้างได้ (Dual Removable Lockable Trays)',
    nameEn: 'Dual SUS304 Stainless Steel Bowls with Quick-Release Cam Locks',
    category: 'mechanical',
    quantity: 2,
    unitPriceThb: 61,
    totalPriceThb: 122,
    specSummary: 'SUS304 Stainless Steel × 2 ใบ · สลักบิดล็อคกันสุนัขคุ้ยคว่ำ · ถอดล้างใส่คืนง่าย',
    roleInProject:
      'รองรับอาหารเม็ดจากรางแยก 2 ทางสำหรับสุนัขในฟาร์ม 2–4 ตัว พร้อมตัวล็อคฐานชามที่สามารถปลดล็อคเพื่อยกชามไปล้างและใส่กลับคืนได้ตามปกติ',
    engineeringDetails: [
      'ตรงตามขอบเขตโครงงานข้อที่ 3 และข้อที่ 4: มีชามสแตนเลส 2 ใบสำหรับรับอาหารจากรางแยก 2 ทาง พร้อมสลักล็อคที่ถอดล้างและใส่ตัวล็อคคืนได้ปกติ',
      'เบ้ารองชามยึดอยู่บนแป้นรับน้ำหนักของ Load Cell โดยมีตัวล็อคบิดหมุน 90° ด้านหน้า ช่วยยึดขอบชามไม่ให้สุนัขคาบหรือตะกุยหลุด',
      'ความสูงของขอบชามออกแบบตามหลักสรีรวิทยาสุนัข (Ergonomics for Dogs) ลดแรงกดที่กระดูกคอขณะก้มกินอาหาร'
    ],
    pdfReference:
      'บทที่ 1 (ขอบเขตข้อ 3: ถาดมีที่ล็อค ถอดล้างได้ และข้อ 4: มีสองทางส่งอาหารเม็ด) & บทที่ 2 (2.2.2.4 การออกแบบตามหลักสรีรวิทยา)',
    externalStandardRef: {
      title: 'NSF/ANSI 2 - Food Equipment Standards & Pet Ergonomics Guidelines.',
      citation:
        'ชามสแตนเลสเกรด 304 ผิวเรียบลดการสะสมของคราบจุลินทรีย์ และระบบล็อคแบบ Quick-Release Latch ช่วยให้ถอดเฉพาะตัวชามออกล้างได้โดยไม่ต้องยุ่งกับสายไฟของ Load Cell ด้านล่าง',
      engineeringNote: 'สามารถกดปุ่มจำลองการปลดล็อคและถอดถาดอาหารบนหน้าจอ 3D ได้โดยตรง'
    },
    cameraTarget: [0, 0.42, 0.9],
    cameraPosition: [0, 1.5, 3.0]
  }
];

export interface AcademicReference {
  id: string;
  category: 'pdf_cited' | 'external_engineering';
  authors: string;
  year: string;
  title: string;
  source: string;
  url?: string;
  appliedInDesign: string;
}

export const ACADEMIC_REFERENCES: AcademicReference[] = [
  {
    id: 'ref-ext-rotary-valve',
    category: 'external_engineering',
    authors: 'Mills, D. (Butterworth-Heinemann)',
    year: '2003',
    title: 'Pneumatic Conveying Design Guide — Chapter 4: Rotary Drop-Through Feeders & Airlock Valves',
    source: 'Butterworth-Heinemann / Elsevier Engineering Series.',
    appliedInDesign:
      '[อ้างอิงการออกแบบใบพัดกังหันตักอาหาร Rotary Paddle Wheel] อธิบายโครงสร้างกังหันตักจ่ายอาหารแบบ Drop-Through ที่มีใบพัดยืดหยุ่น 6 แฉก หมุนอยู่ในห้องทรงกระบอก ช่วยตวงอาหารเม็ดทีละช่อง (Pocket Metering) ป้องกันการติดขัด (Anti-Jamming) และทำหน้าที่เป็นประตูกั้น (Airlock) ไม่ให้อาหารไหลทะลักลงมาเองเมื่อมอเตอร์ 775 หยุดหมุน'
  },
  {
    id: 'ref-ext-chute',
    category: 'external_engineering',
    authors: 'Roberts, A. W.',
    year: '2003',
    title: 'Chute Design Considerations for Feeding and Transfer of Bulk Solids',
    source: 'Bulk Solids Handling, Vol. 23(3), Centre for Bulk Solids and Particulate Technologies.',
    appliedInDesign:
      '[อ้างอิงการออกแบบรางแยก 2 ทาง Y-Splitter] กำหนดมุมลาดเอียงของรางแยกส่งอาหาร 2 ทางที่ 40° (สูงกว่ามุมเสียดทานจลน์ของอาหารเม็ดบนพลาสติก) พร้อมครีบแบ่งกึ่งกลาง (Apex Divider) เพื่อรับอาหารจากห้องใบพัดกังหันแล้วจ่ายออกสู่ชามซ้ายและขวาในสัดส่วน 50:50'
  },
  {
    id: 'ref-ext-relay',
    category: 'external_engineering',
    authors: 'Texas Instruments & Songle Relay Engineering',
    year: '2020',
    title: 'LM2596 Step-Down Switching Regulator & Low-Side DC Motor Relay Switching with Flyback Protection',
    source: 'TI Application Report SNVS124 & Electromechanical Relay Design Guide.',
    appliedInDesign:
      '[อ้างอิงวงจรขับมอเตอร์ 775 ด้วย Relay + Buck Converter] การใช้ไฟ 12V–24V ต่อผ่าน Buck Converter ลงเป็น 5V เลี้ยง ESP32 และการสั่งตัดต่อสายฝั่ง Ground (N) ของมอเตอร์ 775 ด้วย Relay ร่วมกับไดโอดกันไฟย้อน (Flyback Diode 1N5408) เพื่อป้องกันแรงดันกระชากย้อนกลับ'
  },
  {
    id: 'ref-ext-oiml',
    category: 'external_engineering',
    authors: 'OIML R 61-1',
    year: '2017',
    title: 'Automatic Gravimetric Filling Instruments — In-Flight Material Compensation',
    source: 'International Organization of Legal Metrology (OIML).',
    appliedInDesign:
      '[อ้างอิงการตัดไฟมอเตอร์ล่วงหน้า 440–480 กรัม] อธิบายหลักการชดเชยมวลอาหารเม็ดที่กำลังสไลด์อยู่ในรางแยก Y-Splitter (In-Flight Mass) เพื่อให้เมื่อเม็ดสุดท้ายตกลงชามจะได้น้ำหนักรวมตรงตามเป้าหมาย 500 กรัม'
  },
  {
    id: 'ref-1',
    category: 'pdf_cited',
    authors: 'Puttige, A. R., & Samarasinghe, C.',
    year: '2018 (พ.ศ. 2561)',
    title: 'Smart Pet Feeder System Using Internet of Things (IoT)',
    source: 'International Journal of Engineering & Technology, 7(4), 210–214.',
    appliedInDesign:
      'สถาปัตยกรรมระบบอัตโนมัติ (ESP32, Load Cell, Motor Actuator) การตั้งตารางเวลา และการสั่งจ่ายอาหารทางไกลแบบเรียลไทม์'
  },
  {
    id: 'ref-2',
    category: 'pdf_cited',
    authors: 'Lawson, S., Kirman, B., & Linehan, C.',
    year: '2015 (พ.ศ. 2558)',
    title: 'Power and Play: Principles for Designing Interactive Technology for Animals',
    source: 'Proceedings of the 33rd Annual ACM Conference on Human Factors in Computing Systems (CHI 2015).',
    appliedInDesign:
      'แนวคิด Pet-Centered Design: วัสดุ Food-Grade PP ปราศจากสาร BPA, โครงสร้างตัวเครื่องเดี่ยวไร้ขอบคมป้องกันสุนัขแทะ และความสูงชามสแตนเลสตามหลักสรีรวิทยา'
  },
  {
    id: 'ref-3',
    category: 'pdf_cited',
    authors: 'Hoffmann, K. & Tumanski, S.',
    year: '2011 / 2012',
    title: 'An Introduction to Measurements using Strain Gauges & Modern Sensors Handbook',
    source: 'HBM Test and Measurement / John Wiley & Sons.',
    appliedInDesign:
      'ทฤษฎีสเตรนเกจ (ΔR/R = GF × ε), วงจรบริดจ์วีทสโตนแบบ Full-Bridge และการเลือกใช้ Single-Point Parallel Beam Load Cell ร่วมกับ HX711 24-Bit ADC ใต้ชามทั้ง 2 ใบ'
  },
  {
    id: 'ref-4',
    category: 'pdf_cited',
    authors: 'Skinner, B. F. & Telegram Bot API Docs',
    year: '2026',
    title: 'Operant Conditioning Theory & Telegram Bot API (getUpdates / sendMessage)',
    source: 'https://core.telegram.org/bots/api',
    url: 'https://core.telegram.org/bots/api',
    appliedInDesign:
      'การใช้เสียง Buzzer เป็นสิ่งเร้าเงื่อนไข (Conditioned Stimulus) ก่อนเดินมอเตอร์ 775 และการส่งรายงานน้ำหนักอาหารทั้ง 2 ชามเข้าห้องแชท Telegram ผ่าน HTTPS'
  }
];

export const BOM_ITEMS = [
  { no: 1, item: 'ESP32 WiFi Node32s', qty: 1, price: 140, role: 'ไมโครคอนโทรลเลอร์หลัก เชื่อมต่อ Wi-Fi, อ่านค่าชั่งน้ำหนัก และสั่งตัดต่อ Relay' },
  { no: 2, item: 'HX711AD + Load Cell Weight Sensor (10KG)', qty: 2, price: 204, role: 'เซนเซอร์วัดน้ำหนักแบบคานขนาน + โมดูลแปลงสัญญาณ 24-bit แยกใต้ชามซ้าย-ขวา' },
  { no: 3, item: 'DC Motor 775 (12V–36V แรงบิดสูง) + ข้อต่อเพลา Flange 5mm', qty: 1, price: 220, role: 'มอเตอร์หลักตัวเดียวขับใบพัดกังหันตักอาหาร 6 แฉก (แทนเซอร์โว 2 ตัวเดิม)' },
  { no: 4, item: 'ชุดใบพัดกังหันตักอาหาร (ท่อ PVC 4" + แผ่นยางซิลิโคน Food-Grade 6 แฉก)', qty: 1, price: 85, role: 'ห้องกังหันตักอาหารเม็ดจากถังเดี่ยวลงสู่รางแยก 2 ทาง ไม่ติดขัดและกั้นอาหารไม่ให้รั่วไหลเอง' },
  { no: 5, item: 'Relay Module (1-Channel 5V Opto-isolated)', qty: 1, price: 35, role: 'สวิตช์ตัดต่อสายฝั่ง Ground (N) เพื่อสั่งเปิด-ปิดไฟเลี้ยงมอเตอร์ 775 ตามคำสั่ง ESP32' },
  { no: 6, item: 'DC-DC Step-Down Buck Converter (LM2596)', qty: 1, price: 45, role: 'แปลงแรงดันจากแหล่งจ่าย 12V–24V ลงเป็น 5.0V เลี้ยงบอร์ด ESP32, Relay และเซนเซอร์' },
  { no: 7, item: 'RealTimeClock Module RTC DS3231', qty: 1, price: 69, role: 'โมดูลฐานเวลาความแม่นยำสูงสำหรับตั้งเวลาให้อาหารแต่ละมื้อ' },
  { no: 8, item: 'Jumper wires + Breadboard + ไดโอดกันไฟย้อน 1N5408', qty: 1, price: 180, role: 'ชุดสายสัญญาณ แผงต่อวงจร และ Flyback Diode ป้องกันไฟย้อนจากมอเตอร์ 775' },
  { no: 9, item: 'ถังพักอาหารเดี่ยว Food-Grade PP + โครงสร้างรางแยก 2 ทาง (Y-Splitter)', qty: 1, price: 350, role: 'โครงสร้างตัวเครื่องเดี่ยว บรรจุอาหารตรงกลางและแยกส่งอาหารออก 2 ชามซ้าย-ขวา' },
  { no: 10, item: 'ชามอาหารสุนัขสแตนเลส SUS304 (พร้อมสลักล็อคถอดล้างได้)', qty: 2, price: 122, role: 'ถาดรองรับอาหารเม็ด 2 ใบ ถอดล้างทำความสะอาดและใส่ล็อคกลับคืนได้' },
  { no: 11, item: 'Switching Power Supply / Adapter 12V–24V (3A–5A)', qty: 1, price: 160, role: 'แหล่งจ่ายไฟหลักป้อนให้มอเตอร์ 775 และจ่ายเข้าโมดูล Buck Converter' },
  { no: 12, item: 'ค่าทำรูปเล่มและเอกสารวิจัย (บทที่ 1–5)', qty: 1, price: 1700, role: 'การจัดทำรายงานโครงงานและแบบสอบถามประเมินประสิทธิภาพ' }
];
