export interface DistrictInfo {
  name: string;
  nameUrdu: string;
  tehsils: string[]; // Tahseel / Town / Taluka names
  lat: number;
  lng: number;
}

export interface DivisionInfo {
  name: string;
  nameUrdu: string;
  districts: DistrictInfo[];
}

export interface ProvinceInfo {
  name: string;
  nameUrdu: string;
  divisions: DivisionInfo[];
}

export interface CountryInfo {
  name: string;
  nameUrdu: string;
  code: string;
  flag: string;
  centerCoordinates: { lat: number; lng: number };
  provinces: ProvinceInfo[];
}

export const PAKISTAN_PROVINCES: ProvinceInfo[] = [
  {
    name: 'Sindh',
    nameUrdu: 'سندھ',
    divisions: [
      {
        name: 'Mirpur Khas',
        nameUrdu: 'میرپور خاص',
        districts: [
          {
            name: 'Tharparkar',
            nameUrdu: 'تھرپارکر',
            tehsils: ['Mithi', 'Islamkot', 'Chachro', 'Nagarparkar', 'Diplo', 'Dahli'],
            lat: 24.7397,
            lng: 69.8034,
          },
          {
            name: 'Umerkot',
            nameUrdu: 'عمرکوٹ',
            tehsils: ['Umerkot', 'Pithoro', 'Samaro', 'Kunri'],
            lat: 25.3549,
            lng: 69.7374,
          },
          {
            name: 'Mirpur Khas',
            nameUrdu: 'میرپور خاص',
            tehsils: ['Mirpur Khas', 'Digri', 'Kot Ghulam Muhammad', 'Jhuddo', 'Sindhri'],
            lat: 25.5276,
            lng: 69.0159,
          },
        ],
      },
      {
        name: 'Banbhore / Thatta',
        nameUrdu: 'ٹھٹھہ',
        districts: [
          {
            name: 'Thatta',
            nameUrdu: 'ٹھٹھہ',
            tehsils: ['Thatta', 'Mirpur Sakro', 'Ghorabari', 'Keti Bandar'],
            lat: 24.7475,
            lng: 67.9235,
          },
          {
            name: 'Sujawal',
            nameUrdu: 'سجاول',
            tehsils: ['Sujawal', 'Jati', 'Shah Bunder', 'Kharo Chan'],
            lat: 24.6042,
            lng: 68.0772,
          },
          {
            name: 'Badin',
            nameUrdu: 'بدین',
            tehsils: ['Badin', 'Matli', 'Tando Bago', 'Golarchi', 'Talhar'],
            lat: 24.6560,
            lng: 68.8370,
          },
        ],
      },
      {
        name: 'Sukkur',
        nameUrdu: 'سکھر',
        districts: [
          {
            name: 'Sukkur',
            nameUrdu: 'سکھر',
            tehsils: ['Sukkur City', 'New Sukkur', 'Rohri', 'Pano Aqil', 'Salehpat'],
            lat: 27.7052,
            lng: 68.8574,
          },
          {
            name: 'Khairpur',
            nameUrdu: 'خیرپور',
            tehsils: ['Khairpur', 'Nara', 'Kot Diji', 'Sobhodero', 'Kingri', 'Gambh'],
            lat: 27.5295,
            lng: 68.7592,
          },
        ],
      },
      {
        name: 'Karachi',
        nameUrdu: 'کراچی',
        districts: [
          {
            name: 'Korangi District',
            nameUrdu: 'ضلع کورنگی',
            tehsils: ['Landhi', 'Korangi', 'Shah Faisal', 'Model Colony'],
            lat: 24.8485,
            lng: 67.1352,
          },
          {
            name: 'Malir',
            nameUrdu: 'ملیر',
            tehsils: ['Gadap', 'Bin Qasim', 'Murad Memon', 'Ibrahim Hyderi'],
            lat: 24.8918,
            lng: 67.1981,
          },
          {
            name: 'Karachi West',
            nameUrdu: 'کراچی ویسٹ',
            tehsils: ['Manghopir', 'Orangi', 'Mominabad'],
            lat: 24.9782,
            lng: 67.0142,
          },
          {
            name: 'Karachi Central',
            nameUrdu: 'کراچی سینٹرل',
            tehsils: ['Gulberg', 'Liaquatabad', 'North Nazimabad', 'New Karachi'],
            lat: 24.9312,
            lng: 67.0371,
          },
          {
            name: 'Karachi East',
            nameUrdu: 'کراچی ایسٹ',
            tehsils: ['Gulshan-e-Iqbal', 'Jamshed Town', 'Ferozabad'],
            lat: 24.9012,
            lng: 67.0911,
          },
          {
            name: 'Karachi South',
            nameUrdu: 'کراچی ساؤتھ',
            tehsils: ['Saddar', 'Aram Bagh', 'Civil Lines', 'Lyari', 'Garden'],
            lat: 24.8569,
            lng: 67.0099,
          },
          {
            name: 'Keamari',
            nameUrdu: 'کیماڑی',
            tehsils: ['Keamari', 'Baldia', 'Mauripur', 'Harbour'],
            lat: 24.8143,
            lng: 66.9744,
          },
        ],
      },
    ],
  },
  {
    name: 'Punjab',
    nameUrdu: 'پنجاب',
    divisions: [
      {
        name: 'Lahore',
        nameUrdu: 'لاہور',
        districts: [
          {
            name: 'Lahore',
            nameUrdu: 'لاہور',
            tehsils: ['Lahore City', 'Lahore Cantt', 'Model Town', 'Raiwind', 'Shalimar'],
            lat: 31.5204,
            lng: 74.3587,
          },
          {
            name: 'Kasur',
            nameUrdu: 'قصور',
            tehsils: ['Kasur', 'Chunian', 'Pattoki', 'Kot Radha Kishan'],
            lat: 31.1179,
            lng: 74.4408,
          },
        ],
      },
      {
        name: 'Bahawalpur',
        nameUrdu: 'بہاولپور',
        districts: [
          {
            name: 'Bahawalpur',
            nameUrdu: 'بہاولپور',
            tehsils: ['Bahawalpur City', 'Bahawalpur Saddar', 'Ahmedpur East', 'Yazman', 'Khairpur Tamewali'],
            lat: 29.3544,
            lng: 71.6911,
          },
          {
            name: 'Rahim Yar Khan',
            nameUrdu: 'رحیم یار خان',
            tehsils: ['Rahim Yar Khan', 'Sadiqabad', 'Liaquatpur', 'Khanpur'],
            lat: 28.4202,
            lng: 70.2952,
          },
        ],
      },
      {
        name: 'Rawalpindi',
        nameUrdu: 'راولپنڈی',
        districts: [
          {
            name: 'Rawalpindi',
            nameUrdu: 'راولپنڈی',
            tehsils: ['Rawalpindi', 'Gujar Khan', 'Taxila', 'Kahuta', 'Murree', 'Kallar Syedan'],
            lat: 33.5651,
            lng: 73.0169,
          },
          {
            name: 'Attock',
            nameUrdu: 'اٹک',
            tehsils: ['Attock', 'Fateh Jang', 'Pindi Gheb', 'Jand', 'Hassan Abdal', 'Hazro'],
            lat: 33.7660,
            lng: 72.3601,
          },
        ],
      },
      {
        name: 'Dera Ghazi Khan',
        nameUrdu: 'ڈیرہ غازی خان',
        districts: [
          {
            name: 'Dera Ghazi Khan',
            nameUrdu: 'ڈیرہ غازی خان',
            tehsils: ['DG Khan', 'Kot Chutta', 'Taunsa Sharif', 'De-Excluded Area'],
            lat: 30.0489,
            lng: 70.6455,
          },
          {
            name: 'Rajanpur',
            nameUrdu: 'راجن پور',
            tehsils: ['Rajanpur', 'Jampur', 'Rojhan'],
            lat: 29.1044,
            lng: 70.3257,
          },
        ],
      },
    ],
  },
  {
    name: 'Khyber Pakhtunkhwa',
    nameUrdu: 'خیبر پختونخوا',
    divisions: [
      {
        name: 'Peshawar',
        nameUrdu: 'پشاور',
        districts: [
          {
            name: 'Peshawar',
            nameUrdu: 'پشاور',
            tehsils: ['Peshawar City', 'Peshawar Saddar', 'Shah Alam', 'Mathra', 'Badhber'],
            lat: 34.0151,
            lng: 71.5249,
          },
          {
            name: 'Nowshera',
            nameUrdu: 'نوشہرہ',
            tehsils: ['Nowshera', 'Pabbi', 'Jehangira'],
            lat: 34.0153,
            lng: 71.9747,
          },
        ],
      },
      {
        name: 'Malakand',
        nameUrdu: 'مالاکنڈ',
        districts: [
          {
            name: 'Swat',
            nameUrdu: 'سوات',
            tehsils: ['Babuzai', 'Matta', 'Khwazakhela', 'Barikot', 'Kabal', 'Charbagh', 'Bahrain'],
            lat: 35.2227,
            lng: 72.4258,
          },
        ],
      },
      {
        name: 'Dera Ismail Khan',
        nameUrdu: 'ڈیرہ اسماعیل خان',
        districts: [
          {
            name: 'Dera Ismail Khan',
            nameUrdu: 'ڈیرہ اسماعیل خان',
            tehsils: ['DI Khan', 'Kulachi', 'Daraban', 'Paroa', 'Paharpur'],
            lat: 31.8314,
            lng: 70.9019,
          },
        ],
      },
    ],
  },
  {
    name: 'Balochistan',
    nameUrdu: 'بلوچستان',
    divisions: [
      {
        name: 'Quetta',
        nameUrdu: 'کوئٹہ',
        districts: [
          {
            name: 'Quetta',
            nameUrdu: 'کوئٹہ',
            tehsils: ['Quetta City', 'Quetta Saddar', 'Panjpai', 'Kuchlak'],
            lat: 30.1798,
            lng: 66.9750,
          },
        ],
      },
      {
        name: 'Makran',
        nameUrdu: 'مکران',
        districts: [
          {
            name: 'Gwadar',
            nameUrdu: 'گوادر',
            tehsils: ['Gwadar', 'Pasni', 'Ormara', 'Jiwani'],
            lat: 25.1216,
            lng: 62.3254,
          },
        ],
      },
      {
        name: 'Kalat',
        nameUrdu: 'قلات',
        districts: [
          {
            name: 'Lasbela',
            nameUrdu: 'لسبیلہ',
            tehsils: ['Hub', 'Uthal', 'Bela', 'Dureji', 'Gaddani', 'Lakhra'],
            lat: 25.6883,
            lng: 66.5947,
          },
          {
            name: 'Khuzdar',
            nameUrdu: 'خضدار',
            tehsils: ['Khuzdar', 'Wadh', 'Zehri', 'Nal', 'Moola', 'Karkh'],
            lat: 27.8163,
            lng: 66.6177,
          },
        ],
      },
    ],
  },
  {
    name: 'Islamabad Capital Territory',
    nameUrdu: 'وفاقی دارالحکومت اسلام آباد',
    divisions: [
      {
        name: 'Islamabad',
        nameUrdu: 'اسلام آباد',
        districts: [
          {
            name: 'Islamabad',
            nameUrdu: 'اسلام آباد',
            tehsils: ['Sihala', 'Nilore', 'Tarlai', 'Bhara Kahu', 'Zone IV Rural'],
            lat: 33.6844,
            lng: 73.0479,
          },
        ],
      },
    ],
  },
  {
    name: 'Gilgit-Baltistan',
    nameUrdu: 'گلگت بلتستان',
    divisions: [
      {
        name: 'Gilgit',
        nameUrdu: 'گلگت',
        districts: [
          {
            name: 'Gilgit',
            nameUrdu: 'گلگت',
            tehsils: ['Gilgit', 'Danyore', 'Juglot'],
            lat: 35.9208,
            lng: 74.3089,
          },
          {
            name: 'Skardu',
            nameUrdu: 'سکردو',
            tehsils: ['Skardu', 'Rondu', 'Gultari'],
            lat: 35.2971,
            lng: 75.6337,
          },
        ],
      },
    ],
  },
  {
    name: 'Azad Jammu & Kashmir',
    nameUrdu: 'آزاد جموں و کشمیر',
    divisions: [
      {
        name: 'Muzaffarabad',
        nameUrdu: 'مظفر آباد',
        districts: [
          {
            name: 'Muzaffarabad',
            nameUrdu: 'مظفر آباد',
            tehsils: ['Muzaffarabad', 'Naseerabad', 'Pattika'],
            lat: 34.3700,
            lng: 73.4711,
          },
          {
            name: 'Mirpur',
            nameUrdu: 'میرپور',
            tehsils: ['Mirpur', 'Dadyal'],
            lat: 33.1484,
            lng: 73.7519,
          },
        ],
      },
    ],
  },
];

export const GLOBAL_COUNTRIES: CountryInfo[] = [
  {
    name: 'Pakistan',
    nameUrdu: 'پاکستان',
    code: 'PK',
    flag: '🇵🇰',
    centerCoordinates: { lat: 30.3753, lng: 69.3451 },
    provinces: PAKISTAN_PROVINCES,
  },
  {
    name: 'India',
    nameUrdu: 'بھارت / انڈیا',
    code: 'IN',
    flag: '🇮🇳',
    centerCoordinates: { lat: 20.5937, lng: 78.9629 },
    provinces: [
      {
        name: 'Delhi',
        nameUrdu: 'دہلی',
        divisions: [
          {
            name: 'Central Delhi',
            nameUrdu: 'مرکزی دہلی',
            districts: [
              {
                name: 'Central Delhi District',
                nameUrdu: 'ضلع وسطی دہلی',
                tehsils: ['Karol Bagh', 'Kotwali', 'Civil Lines', 'Pahar Ganj'],
                lat: 28.6448,
                lng: 77.2167,
              },
              {
                name: 'New Delhi District',
                nameUrdu: 'ضلع نئی دہلی',
                tehsils: ['Chanakyapuri', 'Connaught Place', 'Parliament Street', 'Delhi Cantt'],
                lat: 28.6139,
                lng: 77.2090,
              },
            ],
          },
          {
            name: 'South Delhi',
            nameUrdu: 'جنوبی دہلی',
            districts: [
              {
                name: 'South Delhi District',
                nameUrdu: 'ضلع جنوبی دہلی',
                tehsils: ['Hauz Khas', 'Mehrauli', 'Saket'],
                lat: 28.5355,
                lng: 77.1990,
              },
              {
                name: 'South East Delhi District',
                nameUrdu: 'ضلع جنوب مشرقی دہلی',
                tehsils: ['Defence Colony', 'Kalkaji', 'Sarita Vihar', 'Okhla'],
                lat: 28.5629,
                lng: 77.2435,
              },
            ],
          },
          {
            name: 'East Delhi',
            nameUrdu: 'مشرقی دہلی',
            districts: [
              {
                name: 'East Delhi District',
                nameUrdu: 'ضلع مشرقی دہلی',
                tehsils: ['Preet Vihar', 'Gandhi Nagar', 'Mayur Vihar'],
                lat: 28.6279,
                lng: 77.2789,
              },
              {
                name: 'Shahdara District',
                nameUrdu: 'ضلع شاہدرہ',
                tehsils: ['Shahdara', 'Seemapuri', 'Vivek Vihar'],
                lat: 28.6738,
                lng: 77.2917,
              },
            ],
          },
          {
            name: 'North Delhi',
            nameUrdu: 'شمالی دہلی',
            districts: [
              {
                name: 'North Delhi District',
                nameUrdu: 'ضلع شمالی دہلی',
                tehsils: ['Alipur', 'Model Town', 'Narela'],
                lat: 28.7182,
                lng: 77.1706,
              },
              {
                name: 'North West Delhi District',
                nameUrdu: 'ضلع شمال مغربی دہلی',
                tehsils: ['Rohini', 'Kanjhawala', 'Saraswati Vihar'],
                lat: 28.7300,
                lng: 77.1200,
              },
            ],
          },
        ],
      },
      {
        name: 'Maharashtra',
        nameUrdu: 'مہاراشٹر',
        divisions: [
          {
            name: 'Konkan / Mumbai',
            nameUrdu: 'کونکن / ممبئی',
            districts: [
              {
                name: 'Mumbai Suburban District',
                nameUrdu: 'ممبئی مضافاتی ضلع',
                tehsils: ['Kurla', 'Andheri', 'Borivali', 'Bandra', 'Ghatkopar'],
                lat: 19.0760,
                lng: 72.8777,
              },
              {
                name: 'Mumbai City District',
                nameUrdu: 'ضلع ممبئی سٹی',
                tehsils: ['Colaba', 'Byculla', 'Dadar', 'Worli', 'Malabar Hill'],
                lat: 18.9220,
                lng: 72.8346,
              },
              {
                name: 'Thane District',
                nameUrdu: 'ضلع تھانے',
                tehsils: ['Thane', 'Kalyan', 'Bhiwandi', 'Mumbra', 'Ulhasnagar'],
                lat: 19.2183,
                lng: 72.9781,
              },
            ],
          },
        ],
      },
      {
        name: 'Uttar Pradesh',
        nameUrdu: 'اتر پردیش',
        divisions: [
          {
            name: 'Meerut',
            nameUrdu: 'میرٹھ',
            districts: [
              {
                name: 'Meerut District',
                nameUrdu: 'ضلع میرٹھ',
                tehsils: ['Meerut City', 'Mawana', 'Sardhana'],
                lat: 28.9845,
                lng: 77.7064,
              },
              {
                name: 'Ghaziabad District',
                nameUrdu: 'ضلع غازی آباد',
                tehsils: ['Ghaziabad', 'Modinagar', 'Loni'],
                lat: 28.6692,
                lng: 77.4538,
              },
            ],
          },
          {
            name: 'Lucknow',
            nameUrdu: 'لکھنؤ',
            districts: [
              {
                name: 'Lucknow District',
                nameUrdu: 'ضلع لکھنؤ',
                tehsils: ['Lucknow', 'Mohanlalganj', 'Bakshi Ka Talab', 'Malihabad'],
                lat: 26.8467,
                lng: 80.9462,
              },
            ],
          },
          {
            name: 'Agra',
            nameUrdu: 'آگرہ',
            districts: [
              {
                name: 'Agra District',
                nameUrdu: 'ضلع آگرہ',
                tehsils: ['Agra', 'Fatehabad', 'Kiraoli', 'Bah'],
                lat: 27.1767,
                lng: 78.0081,
              },
            ],
          },
        ],
      },
      {
        name: 'Gujarat',
        nameUrdu: 'گجرات',
        divisions: [
          {
            name: 'Ahmedabad',
            nameUrdu: 'احمد آباد',
            districts: [
              {
                name: 'Ahmedabad District',
                nameUrdu: 'ضلع احمد آباد',
                tehsils: ['Ahmedabad City', 'Daskroi', 'Sanand', 'Dholka'],
                lat: 23.0225,
                lng: 72.5714,
              },
            ],
          },
          {
            name: 'Surat',
            nameUrdu: 'سورت',
            districts: [
              {
                name: 'Surat District',
                nameUrdu: 'ضلع سورت',
                tehsils: ['Surat City', 'Olpad', 'Bardoli', 'Chorasi'],
                lat: 21.1702,
                lng: 72.8311,
              },
            ],
          },
        ],
      },
      {
        name: 'Rajasthan',
        nameUrdu: 'راجستھان',
        divisions: [
          {
            name: 'Jaipur',
            nameUrdu: 'جے پور',
            districts: [
              {
                name: 'Jaipur District',
                nameUrdu: 'ضلع جے پور',
                tehsils: ['Jaipur City', 'Sanganer', 'Amer', 'Chomu'],
                lat: 26.9124,
                lng: 75.7873,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Bangladesh',
    nameUrdu: 'بنگلہ دیش',
    code: 'BD',
    flag: '🇧🇩',
    centerCoordinates: { lat: 23.6850, lng: 90.3563 },
    provinces: [
      {
        name: 'Dhaka Division',
        nameUrdu: 'ڈھاکہ ڈویژن',
        divisions: [
          {
            name: 'Dhaka Region',
            nameUrdu: 'ڈھاکہ ریجن',
            districts: [
              {
                name: 'Dhaka District',
                nameUrdu: 'ضلع ڈھاکہ',
                tehsils: ['Dhanmondi', 'Mirpur', 'Gulshan', 'Mohammadpur', 'Savar'],
                lat: 23.8103,
                lng: 90.4125,
              },
              {
                name: 'Gazipur District',
                nameUrdu: 'ضلع غازی پور',
                tehsils: ['Gazipur Sadar', 'Kaliakair', 'Kapasia', 'Sreepur'],
                lat: 24.0023,
                lng: 90.4264,
              },
            ],
          },
        ],
      },
      {
        name: 'Chittagong Division',
        nameUrdu: 'چٹاگانگ ڈویژن',
        divisions: [
          {
            name: 'Chittagong Region',
            nameUrdu: 'چٹاگانگ ریجن',
            districts: [
              {
                name: 'Chittagong District',
                nameUrdu: 'ضلع چٹاگانگ',
                tehsils: ['Panchlaish', 'Kotwali', 'Double Mooring', 'Hathazari'],
                lat: 22.3569,
                lng: 91.7832,
              },
            ],
          },
        ],
      },
      {
        name: 'Sylhet Division',
        nameUrdu: 'سلہٹ ڈویژن',
        divisions: [
          {
            name: 'Sylhet Region',
            nameUrdu: 'سلہٹ ریجن',
            districts: [
              {
                name: 'Sylhet District',
                nameUrdu: 'ضلع سلہٹ',
                tehsils: ['Sylhet Sadar', 'Beanibazar', 'Golapganj', 'Zakiganj'],
                lat: 24.8949,
                lng: 91.8687,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Kenya',
    nameUrdu: 'کینیا',
    code: 'KE',
    flag: '🇰🇪',
    centerCoordinates: { lat: -0.0236, lng: 37.9062 },
    provinces: [
      {
        name: 'Nairobi Region',
        nameUrdu: 'نیروبی ریجن',
        divisions: [
          {
            name: 'Nairobi Central',
            nameUrdu: 'مرکزی نیروبی',
            districts: [
              {
                name: 'Nairobi County District',
                nameUrdu: 'نیروبی کاؤنٹی ضلع',
                tehsils: ['Westlands', 'Dagoretti', 'Kibra', 'Embakasi', 'Starehe'],
                lat: -1.2921,
                lng: 36.8219,
              },
            ],
          },
        ],
      },
      {
        name: 'Coast Region',
        nameUrdu: 'ساحلی ریجن',
        divisions: [
          {
            name: 'Mombasa Division',
            nameUrdu: 'ممباسا ڈویژن',
            districts: [
              {
                name: 'Mombasa County District',
                nameUrdu: 'ضلع ممباسا',
                tehsils: ['Mvita', 'Nyali', 'Kisauni', 'Likoni', 'Changamwe'],
                lat: -4.0435,
                lng: 39.6682,
              },
              {
                name: 'Garissa District',
                nameUrdu: 'ضلع غاریسا',
                tehsils: ['Garissa Central', 'Dadaab', 'Balambala', 'Fafi'],
                lat: -0.4532,
                lng: 39.6460,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Uganda',
    nameUrdu: 'یوگنڈا',
    code: 'UG',
    flag: '🇺🇬',
    centerCoordinates: { lat: 1.3733, lng: 32.2903 },
    provinces: [
      {
        name: 'Central Region',
        nameUrdu: 'مرکزی ریجن',
        divisions: [
          {
            name: 'Kampala Division',
            nameUrdu: 'کمپالا ڈویژن',
            districts: [
              {
                name: 'Kampala District',
                nameUrdu: 'ضلع کمپالا',
                tehsils: ['Central Kampala', 'Kawempe', 'Makindye', 'Nakawa', 'Rubaga'],
                lat: 0.3476,
                lng: 32.5825,
              },
            ],
          },
        ],
      },
      {
        name: 'Eastern Region',
        nameUrdu: 'مشرقی ریجن',
        divisions: [
          {
            name: 'Jinja Division',
            nameUrdu: 'جنجا ڈویژن',
            districts: [
              {
                name: 'Jinja District',
                nameUrdu: 'ضلع جنجا',
                tehsils: ['Jinja Central', 'Butembe', 'Kagoma'],
                lat: 0.4479,
                lng: 33.2026,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'United Kingdom',
    nameUrdu: 'برطانیہ',
    code: 'GB',
    flag: '🇬🇧',
    centerCoordinates: { lat: 55.3781, lng: -3.4360 },
    provinces: [
      {
        name: 'England',
        nameUrdu: 'انگلستان',
        divisions: [
          {
            name: 'Greater London',
            nameUrdu: 'گریٹر لندن',
            districts: [
              {
                name: 'Central London District',
                nameUrdu: 'وسطی لندن',
                tehsils: ['City of Westminster', 'Camden', 'Islington', 'Kensington'],
                lat: 51.5074,
                lng: -0.1278,
              },
              {
                name: 'East London District',
                nameUrdu: 'مشرقی لندن',
                tehsils: ['Tower Hamlets', 'Newham', 'Waltham Forest', 'Barking'],
                lat: 51.5200,
                lng: -0.0300,
              },
            ],
          },
          {
            name: 'West Midlands',
            nameUrdu: 'ویسٹ مڈلینڈز',
            districts: [
              {
                name: 'Birmingham District',
                nameUrdu: 'برمنگھم',
                tehsils: ['City Centre', 'Sparkbrook', 'Hall Green', 'Aston'],
                lat: 52.4862,
                lng: -1.8904,
              },
            ],
          },
        ],
      },
    ],
  },
];

export function getCountryByName(name?: string): CountryInfo {
  if (!name) return GLOBAL_COUNTRIES[0];
  const found = GLOBAL_COUNTRIES.find(
    (c) => c.name.toLowerCase() === name.toLowerCase() || c.code.toLowerCase() === name.toLowerCase()
  );
  return found || GLOBAL_COUNTRIES[0];
}

export function getProvincesForCountry(countryName?: string): ProvinceInfo[] {
  const c = getCountryByName(countryName);
  return c.provinces || [];
}

export function getDivisionsForProvince(countryName?: string, provinceName?: string): DivisionInfo[] {
  const provinces = getProvincesForCountry(countryName);
  const prov = provinces.find((p) => p.name.toLowerCase() === (provinceName || '').toLowerCase()) || provinces[0];
  return prov ? prov.divisions : [];
}

export function getDistrictsForDivision(countryName?: string, provinceName?: string, divisionName?: string): DistrictInfo[] {
  const divisions = getDivisionsForProvince(countryName, provinceName);
  if (divisionName) {
    const div = divisions.find((d) => d.name.toLowerCase() === divisionName.toLowerCase());
    if (div) return div.districts;
  }
  return divisions.flatMap((d) => d.districts);
}

export function getTehsilsForDistrict(countryName?: string, provinceName?: string, districtName?: string): string[] {
  const districts = getDistrictsForDivision(countryName, provinceName);
  const dist = districts.find((d) => d.name.toLowerCase() === (districtName || '').toLowerCase());
  return dist ? dist.tehsils : [];
}

export function findGlobalDistrictCoordinates(countryName?: string, districtName?: string): { lat: number; lng: number } {
  if (!districtName) return { lat: 24.8607, lng: 67.0011 };
  const targetCountry = countryName ? getCountryByName(countryName) : null;
  const searchCountries = targetCountry ? [targetCountry] : GLOBAL_COUNTRIES;

  for (const c of searchCountries) {
    for (const prov of c.provinces) {
      for (const div of prov.divisions) {
        for (const dist of div.districts) {
          if (dist.name.toLowerCase() === districtName.toLowerCase()) {
            return { lat: dist.lat, lng: dist.lng };
          }
        }
      }
    }
  }
  return targetCountry?.centerCoordinates || { lat: 30.3753, lng: 69.3451 };
}

export function getAllDistricts(): { province: string; district: DistrictInfo }[] {
  const result: { province: string; district: DistrictInfo }[] = [];
  for (const prov of PAKISTAN_PROVINCES) {
    for (const div of prov.divisions) {
      for (const dist of div.districts) {
        result.push({ province: prov.name, district: dist });
      }
    }
  }
  return result;
}

export function findDistrictCoordinates(districtName: string): { lat: number; lng: number } {
  return findGlobalDistrictCoordinates(undefined, districtName);
}
