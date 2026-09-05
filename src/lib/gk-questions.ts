/** GK question bank: every category has Level 1 (easy), 2 (medium) and 3 (hard). */
export type Q = { q: string; options: string[]; answer: number };
export type Category = { id: string; title: string; emoji: string; blurb: string; levels: Q[][] };

const q = (text: string, options: string[], answer: number): Q => ({ q: text, options, answer });

export const CATEGORIES: Category[] = [
  {
    id: "world",
    title: "World & Capitals",
    emoji: "🌍",
    blurb: "Countries, capitals and flags.",
    levels: [
      [
        q("What is the capital of Japan?", ["Osaka", "Tokyo", "Kyoto", "Seoul"], 1),
        q("Which is the largest continent?", ["Africa", "Europe", "Asia", "Antarctica"], 2),
        q("The Nile mainly flows through which continent?", ["Asia", "Africa", "Europe", "South America"], 1),
        q("Capital of Saudi Arabia?", ["Jeddah", "Mecca", "Riyadh", "Dammam"], 2),
        q("Which country is shaped like a boot?", ["Spain", "Italy", "Greece", "Turkey"], 1),
      ],
      [
        q("Capital of Canada?", ["Toronto", "Vancouver", "Ottawa", "Montreal"], 2),
        q("Which country has the most time zones?", ["Russia", "USA", "France", "China"], 2),
        q("The Sahara desert is mostly in which continent?", ["Asia", "Africa", "Australia", "Europe"], 1),
        q("Which sea lies between Europe and Africa?", ["Red Sea", "Baltic Sea", "Mediterranean Sea", "Caspian Sea"], 2),
        q("Capital of Australia?", ["Sydney", "Melbourne", "Canberra", "Perth"], 2),
      ],
      [
        q("Which country is landlocked and entirely inside another country?", ["Nepal", "Lesotho", "Bolivia", "Laos"], 1),
        q("Capital of Kazakhstan?", ["Almaty", "Astana", "Bishkek", "Tashkent"], 1),
        q("Which strait separates Asia from North America?", ["Strait of Hormuz", "Bering Strait", "Bosphorus", "Malacca"], 1),
        q("Which African country was never colonised?", ["Kenya", "Ethiopia", "Ghana", "Angola"], 1),
        q("Which country has the longest coastline?", ["Russia", "Australia", "Canada", "Norway"], 2),
      ],
    ],
  },
  {
    id: "science",
    title: "Science Sprint",
    emoji: "🔬",
    blurb: "Space, body and everyday science.",
    levels: [
      [
        q("Which planet is known as the Red Planet?", ["Venus", "Mars", "Jupiter", "Mercury"], 1),
        q("What gas do plants take in to make food?", ["Oxygen", "Nitrogen", "Carbon dioxide", "Helium"], 2),
        q("What is H2O commonly called?", ["Salt", "Water", "Sugar", "Acid"], 1),
        q("Which organ pumps blood?", ["Lungs", "Liver", "Heart", "Brain"], 2),
        q("How many bones are in an adult human body?", ["206", "180", "300", "150"], 0),
      ],
      [
        q("What force keeps us on the ground?", ["Magnetism", "Gravity", "Friction", "Pressure"], 1),
        q("Which blood cells fight infection?", ["Red cells", "White cells", "Platelets", "Plasma"], 1),
        q("What is the chemical symbol for gold?", ["Go", "Gd", "Au", "Ag"], 2),
        q("Sound travels fastest through…", ["Air", "Water", "Steel", "Vacuum"], 2),
        q("Which planet has the most moons?", ["Earth", "Mars", "Saturn", "Venus"], 2),
      ],
      [
        q("What is the powerhouse of the cell?", ["Nucleus", "Ribosome", "Mitochondria", "Vacuole"], 2),
        q("Speed of light is about…", ["300 km/s", "3,000 km/s", "300,000 km/s", "30 km/s"], 2),
        q("Which particle has a negative charge?", ["Proton", "Neutron", "Electron", "Photon"], 2),
        q("What does DNA stand for?", ["Deoxyribonucleic acid", "Dinucleic acid", "Dual nucleic acid", "Deep nuclear acid"], 0),
        q("Which gas makes up most of Earth's atmosphere?", ["Oxygen", "Nitrogen", "Argon", "Carbon dioxide"], 1),
      ],
    ],
  },
  {
    id: "history",
    title: "History Heroes",
    emoji: "🏛️",
    blurb: "People and events that shaped the world.",
    levels: [
      [
        q("Who was the first person on the Moon?", ["Yuri Gagarin", "Neil Armstrong", "Buzz Aldrin", "Michael Collins"], 1),
        q("The Great Pyramids are in which country?", ["Iraq", "Mexico", "Egypt", "Greece"], 2),
        q("In which year did World War II end?", ["1939", "1945", "1918", "1950"], 1),
        q("Who wrote 'Romeo and Juliet'?", ["Dickens", "Shakespeare", "Tolstoy", "Homer"], 1),
        q("The Great Wall is in which country?", ["China", "Japan", "India", "Korea"], 0),
      ],
      [
        q("Who was the first woman in space?", ["Sally Ride", "Valentina Tereshkova", "Mae Jemison", "Kalpana Chawla"], 1),
        q("The Titanic sank in which year?", ["1905", "1912", "1920", "1898"], 1),
        q("Which empire built Machu Picchu?", ["Aztec", "Maya", "Inca", "Olmec"], 2),
        q("Who invented the telephone?", ["Edison", "Bell", "Tesla", "Marconi"], 1),
        q("The Berlin Wall fell in…", ["1979", "1989", "1991", "1999"], 1),
      ],
      [
        q("Which treaty ended World War I?", ["Treaty of Paris", "Treaty of Versailles", "Treaty of Vienna", "Treaty of Ghent"], 1),
        q("Who was the first Caliph after Prophet Muhammad ﷺ?", ["Umar", "Uthman", "Abu Bakr", "Ali"], 2),
        q("The Renaissance began in which country?", ["France", "Italy", "England", "Spain"], 1),
        q("Who led India's non-violent independence movement?", ["Nehru", "Gandhi", "Bose", "Patel"], 1),
        q("Which civilisation invented cuneiform writing?", ["Egyptians", "Sumerians", "Greeks", "Chinese"], 1),
      ],
    ],
  },
  {
    id: "current",
    title: "Current Affairs",
    emoji: "📰",
    blurb: "Today's world: countries, leaders and big events.",
    levels: [
      [
        q("Which organisation's headquarters are in New York?", ["NATO", "United Nations", "WHO", "OPEC"], 1),
        q("What does 'AI' stand for?", ["Auto Input", "Artificial Intelligence", "Applied Internet", "Active Info"], 1),
        q("Which currency is used in Saudi Arabia?", ["Dirham", "Riyal", "Dinar", "Rupee"], 1),
        q("Which event happens every four years for athletes worldwide?", ["Olympics", "Grammys", "Expo", "Davos"], 0),
        q("What is the world's most used social video app format?", ["Fax", "Short vertical video", "Radio", "Telegram"], 1),
      ],
      [
        q("Which country hosted the FIFA World Cup 2022?", ["UAE", "Qatar", "Russia", "Brazil"], 1),
        q("Which agency runs the James Webb Space Telescope with ESA and CSA?", ["ISRO", "NASA", "Roscosmos", "JAXA"], 1),
        q("What does COP stand for in climate summits?", ["Council of Peace", "Conference of the Parties", "Climate Order Plan", "Country Ozone Pact"], 1),
        q("Which company makes the ChatGPT assistant?", ["Meta", "OpenAI", "Oracle", "IBM"], 1),
        q("Saudi Arabia's national development plan is called…", ["Vision 2030", "Plan 2040", "Future One", "NEOM Act"], 0),
      ],
      [
        q("The WHO is a specialised agency of which body?", ["G20", "United Nations", "NATO", "ASEAN"], 1),
        q("Which group includes Brazil, Russia, India, China and South Africa?", ["G7", "BRICS", "OPEC", "EFTA"], 1),
        q("What does 'renewable energy' mainly aim to reduce?", ["Data usage", "Carbon emissions", "Population", "Rainfall"], 1),
        q("Which sea level indicator is tracked to measure climate change?", ["Wind colour", "Global mean sea level", "Cloud count", "Sand depth"], 1),
        q("Which technology powers most modern AI chatbots?", ["Blockchain", "Large language models", "Fax networks", "Analog circuits"], 1),
      ],
    ],
  },
  {
    id: "tech",
    title: "Space & Tech",
    emoji: "🚀",
    blurb: "Rockets, computers and inventions.",
    levels: [
      [
        q("What does 'www' stand for?", ["World Wide Web", "Wide World Web", "Web World Wide", "Wired Web World"], 0),
        q("Which planet do we live on?", ["Mars", "Earth", "Venus", "Neptune"], 1),
        q("What device do you use to type?", ["Keyboard", "Monitor", "Speaker", "Printer"], 0),
        q("What is the brain of a computer called?", ["RAM", "CPU", "USB", "GPU"], 1),
        q("Which company makes the iPhone?", ["Samsung", "Apple", "Nokia", "Sony"], 1),
      ],
      [
        q("What does 'GPS' stand for?", ["Global Positioning System", "General Power Supply", "Grid Point Sensor", "Global Phone Signal"], 0),
        q("Which is the first artificial satellite?", ["Apollo 1", "Sputnik 1", "Voyager", "Hubble"], 1),
        q("1 kilobyte is about how many bytes?", ["10", "100", "1,000", "1,000,000"], 2),
        q("Which language runs in web browsers?", ["Python", "JavaScript", "C++", "Swift"], 1),
        q("Who founded SpaceX?", ["Jeff Bezos", "Elon Musk", "Bill Gates", "Larry Page"], 1),
      ],
      [
        q("What does 'HTTP' stand for?", ["HyperText Transfer Protocol", "High Transfer Text Path", "Host Type Transfer Program", "Hyper Tool Transfer Port"], 0),
        q("Which planet has been visited by the most rovers?", ["Venus", "Mars", "Mercury", "Jupiter"], 1),
        q("What is 'machine learning' a branch of?", ["Robotics only", "Artificial intelligence", "Networking", "Databases"], 1),
        q("Which orbit do most communication satellites use?", ["Low polar", "Geostationary", "Solar", "Lunar"], 1),
        q("What is the binary of decimal 5?", ["101", "110", "011", "111"], 0),
      ],
    ],
  },
  {
    id: "sports",
    title: "Sports & Fun",
    emoji: "⚽",
    blurb: "Games, records and champions.",
    levels: [
      [
        q("How many players are on the pitch per football team?", ["9", "10", "11", "12"], 2),
        q("How often are the Summer Olympics held?", ["Every 2 years", "Every 3 years", "Every 4 years", "Every 5 years"], 2),
        q("In cricket, how many balls in one over?", ["4", "6", "8", "10"], 1),
        q("Which sport uses a shuttlecock?", ["Tennis", "Badminton", "Squash", "Hockey"], 1),
        q("What colour card sends a footballer off?", ["Yellow", "Blue", "Red", "Green"], 2),
      ],
      [
        q("How many rings are on the Olympic flag?", ["4", "5", "6", "7"], 1),
        q("In basketball, a shot from behind the arc is worth…", ["1", "2", "3", "4"], 2),
        q("Which country invented judo?", ["China", "Korea", "Japan", "Thailand"], 2),
        q("A marathon is about how many kilometres?", ["21", "30", "42", "50"], 2),
        q("Which tournament is played on grass in London?", ["US Open", "Wimbledon", "Roland Garros", "Australian Open"], 1),
      ],
      [
        q("Who has won the most Ballon d'Or awards?", ["Ronaldo", "Messi", "Zidane", "Pelé"], 1),
        q("In chess, which piece moves in an L shape?", ["Bishop", "Rook", "Knight", "Queen"], 2),
        q("How long is an Olympic swimming pool?", ["25 m", "50 m", "75 m", "100 m"], 1),
        q("Which country has won the most cricket World Cups?", ["India", "Australia", "England", "West Indies"], 1),
        q("In tennis, what is a zero score called?", ["Nil", "Love", "Duck", "Blank"], 1),
      ],
    ],
  },
  {
    id: "nature",
    title: "Nature & Animals",
    emoji: "🦁",
    blurb: "Animals, plants and the planet.",
    levels: [
      [
        q("Which is the largest animal on Earth?", ["Elephant", "Blue whale", "Giraffe", "Shark"], 1),
        q("How many legs does a spider have?", ["6", "8", "10", "12"], 1),
        q("Which bird cannot fly?", ["Eagle", "Penguin", "Parrot", "Sparrow"], 1),
        q("What do bees make?", ["Milk", "Honey", "Silk", "Wax only"], 1),
        q("Which is the fastest land animal?", ["Lion", "Horse", "Cheetah", "Wolf"], 2),
      ],
      [
        q("Which animal is known as the ship of the desert?", ["Horse", "Camel", "Donkey", "Ox"], 1),
        q("What is a group of lions called?", ["Herd", "Pack", "Pride", "Flock"], 2),
        q("Which tree gives us dates?", ["Palm", "Oak", "Pine", "Maple"], 0),
        q("Which animal has the longest lifespan?", ["Elephant", "Giant tortoise", "Dog", "Horse"], 1),
        q("What is the largest rainforest?", ["Congo", "Amazon", "Taiga", "Daintree"], 1),
      ],
      [
        q("What is the study of birds called?", ["Botany", "Ornithology", "Zoology", "Ecology"], 1),
        q("Which mammal can truly fly?", ["Flying squirrel", "Bat", "Colugo", "Sugar glider"], 1),
        q("Photosynthesis mainly happens in which plant part?", ["Root", "Stem", "Leaf", "Flower"], 2),
        q("Which ocean is the deepest?", ["Atlantic", "Indian", "Pacific", "Arctic"], 2),
        q("Coral reefs are built by…", ["Fish", "Tiny animals called polyps", "Seaweed", "Sand"], 1),
      ],
    ],
  },
  {
    id: "words",
    title: "Words & Brain",
    emoji: "🔤",
    blurb: "Language, logic and quick teasers.",
    levels: [
      [
        q("How many letters are in the English alphabet?", ["24", "25", "26", "27"], 2),
        q("What is the opposite of 'ancient'?", ["Old", "Modern", "Huge", "Quiet"], 1),
        q("Which one is a vowel?", ["B", "E", "K", "T"], 1),
        q("How many minutes are in two hours?", ["100", "110", "120", "140"], 2),
        q("What does 'GK' stand for?", ["Good Knowledge", "General Knowledge", "Great Kids", "Global Key"], 1),
      ],
      [
        q("A synonym of 'brave' is…", ["Timid", "Courageous", "Lazy", "Silent"], 1),
        q("Which word is a noun?", ["Quickly", "Happiness", "Run", "Blue"], 1),
        q("What comes next: 2, 4, 8, 16, …?", ["18", "24", "32", "20"], 2),
        q("'Bibliophile' means a lover of…", ["Films", "Books", "Food", "Birds"], 1),
        q("Which punctuation ends a question?", ["Comma", "Full stop", "Question mark", "Colon"], 2),
      ],
      [
        q("What is a palindrome?", ["A poem", "A word read the same both ways", "A long sentence", "A rhyme"], 1),
        q("Which is an antonym of 'scarce'?", ["Rare", "Abundant", "Slim", "Faint"], 1),
        q("Odd one out: sonnet, haiku, limerick, novel", ["Sonnet", "Haiku", "Limerick", "Novel"], 3),
        q("If all Bloops are Razzies and all Razzies are Lazzies, then all Bloops are…", ["Not Lazzies", "Lazzies", "Only Razzies", "Unknown"], 1),
        q("What comes next: J, F, M, A, M, …?", ["J", "S", "A", "O"], 0),
      ],
    ],
  },
];

export const LEVEL_LABELS = ["Level 1 · Easy", "Level 2 · Medium", "Level 3 · Hard"];
