/**
 * Run once to populate the database with an admin user and sample data.
 * deno task seed
 *
 * Safe to re-run — uses INSERT OR IGNORE throughout.
 *
 * Programmes:
 *   1  BSc Computer Science          (Undergraduate)
 *   2  MSc Cyber Security            (Postgraduate)
 *   3  BSc Software Engineering      (Undergraduate)
 *   4  BA Modern Languages           (Undergraduate)
 *   5  MSc Data Science              (Postgraduate)
 *   6  BSc Business Information Tech (Undergraduate)
 *   7  MA Creative Writing           (Postgraduate)
 */
import { db } from "../db.ts";
import { hash } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

// ─── Admin user ───────────────────────────────────────────────────────────────

const passwordHash = await hash("admin123");
db.prepare(
  "INSERT OR IGNORE INTO admins (username, password_hash) VALUES (?, ?)"
).run("admin", passwordHash);
console.log("✓ Admin user ready  —  admin / admin123");

// ─── Programmes ───────────────────────────────────────────────────────────────

db.prepare(`
  INSERT OR IGNORE INTO programmes (id, title, level, description, published) VALUES
  (1, 'BSc Computer Science', 'Undergraduate',
   'A comprehensive programme covering algorithms, software engineering, systems programming, and artificial intelligence. Graduates are equipped for careers in software development, data science, and research.',
   1),
  (2, 'MSc Cyber Security', 'Postgraduate',
   'Advanced study of network security, cryptography, penetration testing, and digital forensics. Designed for computing graduates seeking specialist expertise in information security.',
   1),
  (3, 'BSc Software Engineering', 'Undergraduate',
   'A practice-focused programme centred on software development methodologies, agile project management, testing, and DevOps. Students build real-world systems across every year of study.',
   1),
  (4, 'BA Modern Languages', 'Undergraduate',
   'Study two or more languages from French, Spanish, German, Mandarin, and Arabic alongside their literatures, cultures, and linguistics. Includes a compulsory year abroad at a partner university.',
   1),
  (5, 'MSc Data Science', 'Postgraduate',
   'Rigorous training in statistical modelling, machine learning, big data engineering, and data visualisation. Prepares graduates for roles as data scientists and analysts across industry and academia.',
   1),
  (6, 'BSc Business Information Technology', 'Undergraduate',
   'A joint programme bridging computer science and business management. Covers information systems, project management, enterprise software, and digital strategy.',
   1),
  (7, 'MA Creative Writing', 'Postgraduate',
   'An intensive workshop-based programme developing advanced skills in fiction, poetry, screenwriting, and creative non-fiction. Students produce a substantial creative portfolio and critical commentary.',
   1)
`).run();
console.log("✓ Programmes ready");

// ─── Staff ────────────────────────────────────────────────────────────────────

db.prepare(`
  INSERT OR IGNORE INTO staff (id, name, email, bio) VALUES
  -- Computing faculty
  (1,  'Dr Sarah Mitchell',    'sarah.mitchell@university.ac.uk',
   'Programme leader for BSc Computer Science. Research interests include compiler design and programming language theory.'),
  (2,  'Prof James Okafor',    'james.okafor@university.ac.uk',
   'Programme leader for MSc Cyber Security. 20 years of industry experience in network defence and digital forensics.'),
  (3,  'Dr Priya Sharma',      'priya.sharma@university.ac.uk',
   'Programme leader for BSc Software Engineering. Specialist in agile methods and software quality assurance.'),
  (4,  'Dr Tom Nguyen',        'tom.nguyen@university.ac.uk',
   'Teaches algorithms, data structures, and theoretical computer science.'),
  (5,  'Dr Amelia Brooks',     'amelia.brooks@university.ac.uk',
   'Web technologies and full-stack development specialist.'),
  (6,  'Dr Hassan Al-Rashid',  'hassan.al-rashid@university.ac.uk',
   'Cyber security researcher with a focus on cryptographic protocols and malware analysis.'),
  (7,  'Dr Chloe Barker',      'chloe.barker@university.ac.uk',
   'Artificial intelligence and machine learning lecturer.'),
  (8,  'Dr Marcus Reid',       'marcus.reid@university.ac.uk',
   'Database systems and cloud computing specialist.'),
  -- Data Science faculty
  (9,  'Prof Lena Fischer',    'lena.fischer@university.ac.uk',
   'Programme leader for MSc Data Science. Research focuses on probabilistic machine learning and Bayesian inference.'),
  (10, 'Dr Kwame Asante',      'kwame.asante@university.ac.uk',
   'Big data engineering and distributed computing lecturer. Apache Spark and Kafka specialist.'),
  (11, 'Dr Yuki Tanaka',       'yuki.tanaka@university.ac.uk',
   'Data visualisation and statistical modelling specialist.'),
  -- Business IT faculty
  (12, 'Dr Rachel O''Connor',  'rachel.oconnor@university.ac.uk',
   'Programme leader for BSc Business Information Technology. Expert in enterprise systems and digital transformation strategy.'),
  (13, 'Dr Finn Larsen',       'finn.larsen@university.ac.uk',
   'Information systems and project management lecturer. PRINCE2 and PMP certified.'),
  -- Languages faculty
  (14, 'Prof Claire Dubois',   'claire.dubois@university.ac.uk',
   'Programme leader for BA Modern Languages. Specialist in French linguistics and postcolonial Francophone literature.'),
  (15, 'Dr Alejandro Vega',    'alejandro.vega@university.ac.uk',
   'Spanish and Latin American studies. Research interests in contemporary Latin American fiction.'),
  (16, 'Dr Mei-Ling Zhou',     'mei-ling.zhou@university.ac.uk',
   'Mandarin language and Chinese cultural studies specialist.'),
  (17, 'Dr Stefan Bauer',      'stefan.bauer@university.ac.uk',
   'German language and literature. Research focus on 20th-century German drama.'),
  -- Creative Writing faculty
  (18, 'Prof Nina Okafor',     'nina.okafor@university.ac.uk',
   'Programme leader for MA Creative Writing. Award-winning novelist and short story writer.'),
  (19, 'Dr Patrick Doyle',     'patrick.doyle@university.ac.uk',
   'Poetry and creative non-fiction specialist. Three published collections.'),
  (20, 'Dr Sunita Mehta',      'sunita.mehta@university.ac.uk',
   'Screenwriting and dramatic writing lecturer. Former BBC script editor.')
`).run();
console.log("✓ Staff ready");

// ─── Modules — BSc Computer Science (1) ──────────────────────────────────────

db.prepare(`
  INSERT OR IGNORE INTO modules (id, programme_id, title, year, description) VALUES
  (101, 1, 'Introduction to Programming',     1, 'Foundations of programming using Python. Covers variables, control flow, functions, and basic object-oriented concepts.'),
  (102, 1, 'Web Technologies',                1, 'HTML, CSS, and JavaScript fundamentals. Students build and deploy their first web pages.'),
  (103, 1, 'Computer Systems',                1, 'Binary arithmetic, memory architecture, operating system concepts, and the Linux command line.'),
  (104, 1, 'Mathematics for Computing',       1, 'Set theory, logic, probability, and discrete mathematics relevant to computer science.'),
  (105, 1, 'Data Structures and Algorithms',  2, 'Arrays, linked lists, trees, graphs, sorting algorithms, and Big-O complexity analysis.'),
  (106, 1, 'Database Systems',                2, 'Relational database design, SQL, normalisation, transactions, and an introduction to NoSQL.'),
  (107, 1, 'Object-Oriented Software Design', 2, 'Design patterns, UML, SOLID principles, and writing maintainable, testable code in Java.'),
  (108, 1, 'Networks and Protocols',          2, 'TCP/IP stack, HTTP, DNS, routing protocols, and network security fundamentals.'),
  (109, 1, 'Advanced Web Development',        3, 'Full-stack web applications using Node.js, React, and cloud deployment with Docker and CI/CD pipelines.'),
  (110, 1, 'Artificial Intelligence',         3, 'Search algorithms, machine learning, neural networks, and ethical considerations in AI.'),
  (111, 1, 'Final Year Project',              3, 'A substantial individual research and development project supervised by an academic member of staff.'),
  (112, 1, 'Distributed Systems',             3, 'Concurrency, fault tolerance, consensus protocols, and microservices architecture.')
`).run();
console.log("✓ BSc Computer Science modules ready");

// ─── Modules — MSc Cyber Security (2) ────────────────────────────────────────

db.prepare(`
  INSERT OR IGNORE INTO modules (id, programme_id, title, year, description) VALUES
  (201, 2, 'Network Security Fundamentals',            1, 'Firewalls, intrusion detection systems, VPNs, and secure network architecture design.'),
  (202, 2, 'Cryptography and Secure Comms',            1, 'Symmetric and asymmetric encryption, digital signatures, TLS/SSL, and PKI infrastructure.'),
  (203, 2, 'Ethical Hacking and Penetration Testing',  1, 'Reconnaissance, exploitation techniques, post-exploitation, and responsible disclosure. Conducted in a controlled lab environment.'),
  (204, 2, 'Digital Forensics',                        1, 'Evidence acquisition, chain of custody, file system analysis, and forensic tools such as Autopsy and Wireshark.'),
  (205, 2, 'Malware Analysis',                         1, 'Static and dynamic analysis of malicious software. Reverse engineering with IDA Pro and sandbox environments.'),
  (206, 2, 'Security Policy and Compliance',           1, 'ISO 27001, GDPR, NIST frameworks, risk assessment methodologies, and writing information security policies.'),
  (207, 2, 'MSc Dissertation',                         2, 'Independent research dissertation on a cyber security topic agreed with a supervisor. 15,000–20,000 words.')
`).run();
console.log("✓ MSc Cyber Security modules ready");

// ─── Modules — BSc Software Engineering (3) ──────────────────────────────────

db.prepare(`
  INSERT OR IGNORE INTO modules (id, programme_id, title, year, description) VALUES
  (301, 3, 'Programming Fundamentals',       1, 'Core programming concepts in Python and Java. Emphasis on writing clean, readable, well-tested code from day one.'),
  (302, 3, 'Software Development Lifecycle', 1, 'Waterfall, Scrum, and Kanban methodologies. Planning, estimation, and managing software projects.'),
  (303, 3, 'Version Control and Tooling',    1, 'Git workflows, branching strategies, CI basics, and the modern developer toolchain.'),
  (304, 3, 'Web Application Basics',         1, 'Client-server architecture, HTML/CSS/JS, REST APIs, and building a first full-stack application.'),
  (305, 3, 'Agile Software Development',     2, 'Deep dive into Scrum and XP. Sprint planning, retrospectives, user stories, and working in development teams.'),
  (306, 3, 'Software Testing and QA',        2, 'Unit, integration, and end-to-end testing. TDD, BDD, automated test pipelines, and code coverage analysis.'),
  (307, 3, 'Software Architecture',          2, 'Layered, event-driven, and microservices architectures. Architecture decision records and trade-off analysis.'),
  (308, 3, 'Database Design and ORM',        2, 'Relational and document databases, ORM frameworks, query optimisation, and migration strategies.'),
  (309, 3, 'DevOps and Cloud Deployment',    3, 'Docker, Kubernetes, CI/CD pipelines, infrastructure as code with Terraform, and deploying to AWS/GCP.'),
  (310, 3, 'Human-Computer Interaction',     3, 'User research, usability testing, accessible design, and building software that real people can use.'),
  (311, 3, 'Group Software Project',         3, 'A team-based capstone project delivering a full software product from specification to deployment.'),
  (312, 3, 'Professional Practice',          3, 'Ethics in software engineering, intellectual property, careers, and preparation for industry.')
`).run();
console.log("✓ BSc Software Engineering modules ready");

// ─── Modules — BA Modern Languages (4) ───────────────────────────────────────

db.prepare(`
  INSERT OR IGNORE INTO modules (id, programme_id, title, year, description) VALUES
  (401, 4, 'Language Skills 1: French',              1, 'Intensive development of French reading, writing, listening, and speaking at B1–B2 level. Grammar consolidation and academic writing in French.'),
  (402, 4, 'Language Skills 1: Spanish',             1, 'Intensive development of Spanish reading, writing, listening, and speaking at B1–B2 level. Emphasis on Iberian and Latin American varieties.'),
  (403, 4, 'Introduction to Linguistics',            1, 'Phonology, morphology, syntax, and semantics. How language is structured and how languages differ across the world.'),
  (404, 4, 'Cultures of the Francophone World',      1, 'Survey of French and Francophone literature, cinema, and society from the 20th century to the present.'),
  (405, 4, 'Language Skills 2: French',              2, 'Advanced French language work at C1 level. Translation, interpreting practice, and extended writing.'),
  (406, 4, 'Language Skills 2: Spanish',             2, 'Advanced Spanish at C1 level. Texts from Spain, Mexico, Argentina, and Colombia. Oral and written proficiency.'),
  (407, 4, 'Hispanic Literature and Film',           2, 'Close reading of key texts and films from the Spanish-speaking world. Themes of identity, politics, and memory.'),
  (408, 4, 'Year Abroad',                            2, 'A compulsory year spent at a partner university in a country where your chosen language is spoken. Students take courses, intern, or teach English.'),
  (409, 4, 'Language Skills 3: French',              3, 'C1–C2 level French. Consecutive interpreting, specialised translation (legal, medical, literary), and advanced composition.'),
  (410, 4, 'Language Skills 3: Spanish',             3, 'C1–C2 level Spanish. Comparative translation and independent research into a specialist area of Spanish language.'),
  (411, 4, 'Dissertation',                           3, 'A 10,000-word independent research dissertation on a topic in languages, linguistics, or cultural studies.'),
  (412, 4, 'Language, Power, and Identity',          3, 'Critical exploration of how language relates to gender, race, nationality, and social power. Sociolinguistics and discourse analysis.')
`).run();
console.log("✓ BA Modern Languages modules ready");

// ─── Modules — MSc Data Science (5) ──────────────────────────────────────────

db.prepare(`
  INSERT OR IGNORE INTO modules (id, programme_id, title, year, description) VALUES
  (501, 5, 'Statistical Foundations of Data Science', 1, 'Probability theory, hypothesis testing, regression, Bayesian inference, and the mathematics underpinning modern data science.'),
  (502, 5, 'Machine Learning',                        1, 'Supervised and unsupervised learning algorithms, model evaluation, cross-validation, ensemble methods, and neural networks.'),
  (503, 5, 'Big Data Engineering',                    1, 'Hadoop, Spark, Kafka, and cloud data pipelines. Processing and storing data at scale on AWS and GCP.'),
  (504, 5, 'Data Visualisation and Storytelling',     1, 'Principles of visual communication. Tableau, D3.js, and Python libraries (Matplotlib, Seaborn, Plotly) for exploratory and explanatory analysis.'),
  (505, 5, 'Natural Language Processing',             1, 'Text preprocessing, sentiment analysis, named entity recognition, transformers, and large language model applications.'),
  (506, 5, 'Ethics and Governance in Data Science',  1, 'Bias and fairness in ML systems, GDPR, responsible AI frameworks, and the social impact of data-driven decision making.'),
  (507, 5, 'MSc Dissertation',                        2, 'An original data science research project. Students collect or source data, apply appropriate methods, and present findings in a 15,000-word dissertation.')
`).run();
console.log("✓ MSc Data Science modules ready");

// ─── Modules — BSc Business Information Technology (6) ───────────────────────

db.prepare(`
  INSERT OR IGNORE INTO modules (id, programme_id, title, year, description) VALUES
  (601, 6, 'Introduction to Information Systems',  1, 'The role of IT in modern organisations. ERP systems, business processes, and how information flows through an enterprise.'),
  (602, 6, 'Business Fundamentals',                1, 'Accounting, marketing, operations, and organisational behaviour. Designed for students new to business study.'),
  (603, 6, 'Programming for Business',             1, 'Python scripting for business automation. Working with spreadsheets, APIs, and databases from a business analyst perspective.'),
  (604, 6, 'Digital Business and E-Commerce',      1, 'Online business models, digital marketing, UX for e-commerce, and analytics for web properties.'),
  (605, 6, 'Information Systems Project Mgmt',     2, 'PRINCE2 and agile approaches to managing IT projects. Risk management, stakeholder communication, and project governance.'),
  (606, 6, 'Enterprise Systems and ERP',           2, 'SAP and Microsoft Dynamics. Configuring and using enterprise resource planning systems in finance, HR, and supply chain contexts.'),
  (607, 6, 'Business Intelligence and Analytics',  2, 'Data warehousing, OLAP, Power BI, and SQL-based reporting. Turning data into decisions.'),
  (608, 6, 'Cybersecurity for Business',           2, 'Information security risk management, GDPR compliance, incident response, and security awareness for non-technical stakeholders.'),
  (609, 6, 'Digital Transformation Strategy',      3, 'Leading organisational change through technology. Cloud adoption, AI strategy, and building digital capabilities.'),
  (610, 6, 'IT Consulting and Professional Skills',3, 'Client engagement, requirements gathering, proposal writing, and presenting technical solutions to non-technical audiences.'),
  (611, 6, 'Capstone Business IT Project',         3, 'A real-world industry project undertaken with a partner organisation. Students deliver an information systems solution and present to stakeholders.'),
  (612, 6, 'Emerging Technologies',                3, 'Blockchain, IoT, AR/VR, and AI. Critical evaluation of emerging tech trends and their business applications.')
`).run();
console.log("✓ BSc Business Information Technology modules ready");

// ─── Modules — MA Creative Writing (7) ───────────────────────────────────────

db.prepare(`
  INSERT OR IGNORE INTO modules (id, programme_id, title, year, description) VALUES
  (701, 7, 'Fiction Workshop',                  1, 'Weekly workshop critique of student short fiction. Focuses on character, voice, structure, and revision strategies.'),
  (702, 7, 'Poetry Workshop',                   1, 'Intensive study and practice of poetic forms, from the sonnet to free verse. Reading contemporary poets alongside generating and workshopping original work.'),
  (703, 7, 'Screenwriting Fundamentals',        1, 'Three-act structure, scene construction, dialogue, and formatting. Students write and pitch a short film script.'),
  (704, 7, 'Reading as a Writer',               1, 'Close reading of literary fiction, memoir, and essays. Analysis of craft decisions: point of view, tense, imagery, and structure.'),
  (705, 7, 'Creative Non-Fiction',              1, 'Personal essay, literary journalism, and memoir. Truth-telling, research, and the ethics of writing about real people and events.'),
  (706, 7, 'Writing for Stage and Screen',      1, 'From stage play to feature screenplay. Developing dramatic structure and writing compelling scenes for performance.'),
  (707, 7, 'MA Creative Writing Portfolio',     2, 'A substantial original creative work (15,000–25,000 words) in a genre of the student''s choice, accompanied by a critical commentary of 5,000 words.')
`).run();
console.log("✓ MA Creative Writing modules ready");

// ─── Programme leader assignments ─────────────────────────────────────────────

db.prepare(`
  INSERT OR IGNORE INTO programme_leaders (programme_id, staff_id) VALUES
  (1, 1),   -- Dr Sarah Mitchell        → BSc Computer Science
  (2, 2),   -- Prof James Okafor        → MSc Cyber Security
  (3, 3),   -- Dr Priya Sharma          → BSc Software Engineering
  (4, 14),  -- Prof Claire Dubois       → BA Modern Languages
  (5, 9),   -- Prof Lena Fischer        → MSc Data Science
  (6, 12),  -- Dr Rachel O'Connor       → BSc Business IT
  (7, 18)   -- Prof Nina Okafor         → MA Creative Writing
`).run();
console.log("✓ Programme leaders assigned");

// ─── Module leader assignments ────────────────────────────────────────────────

db.prepare(`
  INSERT OR IGNORE INTO module_leaders (module_id, staff_id) VALUES
  -- BSc Computer Science
  (101, 1),  (102, 5),  (103, 4),  (104, 4),
  (105, 4),  (106, 8),  (107, 1),  (108, 2),
  (109, 5),  (110, 7),  (111, 1),  (112, 8),

  -- MSc Cyber Security
  (201, 2),  (202, 6),  (203, 6),  (204, 2),
  (205, 6),  (206, 2),  (207, 2),

  -- BSc Software Engineering
  (301, 3),  (302, 3),  (303, 5),  (304, 5),
  (305, 3),  (306, 4),  (307, 8),  (308, 8),
  (309, 5),  (310, 7),  (311, 3),  (312, 1),

  -- BA Modern Languages
  (401, 14), (402, 15), (403, 14), (404, 14),
  (405, 14), (406, 15), (407, 15), (408, 14),
  (409, 14), (410, 15), (411, 14), (412, 16),

  -- MSc Data Science
  (501, 9),  (502, 9),  (503, 10), (504, 11),
  (505, 7),  (506, 9),  (507, 9),

  -- BSc Business Information Technology
  (601, 12), (602, 12), (603, 5),  (604, 12),
  (605, 13), (606, 13), (607, 11), (608, 6),
  (609, 12), (610, 13), (611, 12), (612, 8),

  -- MA Creative Writing
  (701, 18), (702, 19), (703, 20), (704, 18),
  (705, 19), (706, 20), (707, 18)
`).run();
console.log("✓ Module leaders assigned");

console.log("\n✔ Seed complete.");
console.log("  Student site:  http://localhost:8000");
console.log("  Admin panel:   http://localhost:8000/admin  (admin / admin123)");
console.log("  Staff portal:  http://localhost:8000/staff/portal");

db.close();
