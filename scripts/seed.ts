/**
 * Run once to populate the database with an admin user and sample data.
 * deno task seed
 *
 * Safe to re-run — uses INSERT OR IGNORE throughout.
 */
import { db } from "../db.ts";
import { hash } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

// ─── Admin user ──────────────────────────────────────────────────────────

const passwordHash = await hash("admin123");
db.prepare(
  "INSERT OR IGNORE INTO admins (username, password_hash) VALUES (?, ?)"
).run("admin", passwordHash);
console.log("✓ Admin user ready  —  admin / admin123");

// ─── Programmes ─────────────────────────────────────────────────────────

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
   1)
`).run();
console.log("✓ Programmes ready");

// ─── Staff ────────────────────────────────────────────────────────────────
// IDs are stable so leader assignments below always refer to the right person.

db.prepare(`
  INSERT OR IGNORE INTO staff (id, name, email, bio) VALUES
  (1, 'Dr Sarah Mitchell',  'sarah.mitchell@university.ac.uk',
   'Programme leader for BSc Computer Science. Research interests include compiler design and programming language theory.'),
  (2, 'Prof James Okafor',  'james.okafor@university.ac.uk',
   'Programme leader for MSc Cyber Security. 20 years of industry experience in network defence and digital forensics.'),
  (3, 'Dr Priya Sharma',    'priya.sharma@university.ac.uk',
   'Programme leader for BSc Software Engineering. Specialist in agile methods and software quality assurance.'),
  (4, 'Dr Tom Nguyen',      'tom.nguyen@university.ac.uk',
   'Teaches algorithms, data structures, and theoretical computer science.'),
  (5, 'Dr Amelia Brooks',   'amelia.brooks@university.ac.uk',
   'Web technologies and full-stack development specialist.'),
  (6, 'Dr Hassan Al-Rashid','hassan.al-rashid@university.ac.uk',
   'Cyber security researcher with a focus on cryptographic protocols and malware analysis.'),
  (7, 'Dr Chloe Barker',    'chloe.barker@university.ac.uk',
   'Artificial intelligence and machine learning lecturer.'),
  (8, 'Dr Marcus Reid',     'marcus.reid@university.ac.uk',
   'Database systems and cloud computing specialist.')
`).run();
console.log("✓ Staff ready");

// ─── Modules — BSc Computer Science (programme 1) ──────────────────────────────

db.prepare(`
  INSERT OR IGNORE INTO modules (id, programme_id, title, year, description) VALUES
  -- Year 1
  (101, 1, 'Introduction to Programming',     1, 'Foundations of programming using Python. Covers variables, control flow, functions, and basic object-oriented concepts.'),
  (102, 1, 'Web Technologies',                1, 'HTML, CSS, and JavaScript fundamentals. Students build and deploy their first web pages.'),
  (103, 1, 'Computer Systems',                1, 'Binary arithmetic, memory architecture, operating system concepts, and the Linux command line.'),
  (104, 1, 'Mathematics for Computing',       1, 'Set theory, logic, probability, and discrete mathematics relevant to computer science.'),
  -- Year 2
  (105, 1, 'Data Structures and Algorithms',  2, 'Arrays, linked lists, trees, graphs, sorting algorithms, and Big-O complexity analysis.'),
  (106, 1, 'Database Systems',                2, 'Relational database design, SQL, normalisation, transactions, and an introduction to NoSQL.'),
  (107, 1, 'Object-Oriented Software Design', 2, 'Design patterns, UML, SOLID principles, and writing maintainable, testable code in Java.'),
  (108, 1, 'Networks and Protocols',          2, 'TCP/IP stack, HTTP, DNS, routing protocols, and network security fundamentals.'),
  -- Year 3
  (109, 1, 'Advanced Web Development',        3, 'Full-stack web applications using Node.js, React, and cloud deployment with Docker and CI/CD pipelines.'),
  (110, 1, 'Artificial Intelligence',         3, 'Search algorithms, machine learning, neural networks, and ethical considerations in AI.'),
  (111, 1, 'Final Year Project',              3, 'A substantial individual research and development project supervised by an academic member of staff.'),
  (112, 1, 'Distributed Systems',             3, 'Concurrency, fault tolerance, consensus protocols, and microservices architecture.')
`).run();
console.log("✓ BSc Computer Science modules ready");

// ─── Modules — MSc Cyber Security (programme 2) ───────────────────────────────

db.prepare(`
  INSERT OR IGNORE INTO modules (id, programme_id, title, year, description) VALUES
  -- Year 1 (MSc = 1 taught year + dissertation)
  (201, 2, 'Network Security Fundamentals',   1, 'Firewalls, intrusion detection systems, VPNs, and secure network architecture design.'),
  (202, 2, 'Cryptography and Secure Comms',   1, 'Symmetric and asymmetric encryption, digital signatures, TLS/SSL, and PKI infrastructure.'),
  (203, 2, 'Ethical Hacking and Penetration Testing', 1, 'Reconnaissance, exploitation techniques, post-exploitation, and responsible disclosure. Conducted in a controlled lab environment.'),
  (204, 2, 'Digital Forensics',               1, 'Evidence acquisition, chain of custody, file system analysis, and forensic tools such as Autopsy and Wireshark.'),
  (205, 2, 'Malware Analysis',                1, 'Static and dynamic analysis of malicious software. Reverse engineering with IDA Pro and sandbox environments.'),
  (206, 2, 'Security Policy and Compliance',  1, 'ISO 27001, GDPR, NIST frameworks, risk assessment methodologies, and writing information security policies.'),
  -- Year 2 (dissertation)
  (207, 2, 'MSc Dissertation',                2, 'Independent research dissertation on a cyber security topic agreed with a supervisor. 15,000–20,000 words.')
`).run();
console.log("✓ MSc Cyber Security modules ready");

// ─── Modules — BSc Software Engineering (programme 3) ────────────────────────

db.prepare(`
  INSERT OR IGNORE INTO modules (id, programme_id, title, year, description) VALUES
  -- Year 1
  (301, 3, 'Programming Fundamentals',        1, 'Core programming concepts in Python and Java. Emphasis on writing clean, readable, well-tested code from day one.'),
  (302, 3, 'Software Development Lifecycle',  1, 'Waterfall, Scrum, and Kanban methodologies. Planning, estimation, and managing software projects.'),
  (303, 3, 'Version Control and Tooling',     1, 'Git workflows, branching strategies, CI basics, and the modern developer toolchain.'),
  (304, 3, 'Web Application Basics',          1, 'Client-server architecture, HTML/CSS/JS, REST APIs, and building a first full-stack application.'),
  -- Year 2
  (305, 3, 'Agile Software Development',      2, 'Deep dive into Scrum and XP. Sprint planning, retrospectives, user stories, and working in development teams.'),
  (306, 3, 'Software Testing and QA',         2, 'Unit, integration, and end-to-end testing. TDD, BDD, automated test pipelines, and code coverage analysis.'),
  (307, 3, 'Software Architecture',           2, 'Layered, event-driven, and microservices architectures. Architecture decision records and trade-off analysis.'),
  (308, 3, 'Database Design and ORM',         2, 'Relational and document databases, ORM frameworks, query optimisation, and migration strategies.'),
  -- Year 3
  (309, 3, 'DevOps and Cloud Deployment',     3, 'Docker, Kubernetes, CI/CD pipelines, infrastructure as code with Terraform, and deploying to AWS/GCP.'),
  (310, 3, 'Human-Computer Interaction',      3, 'User research, usability testing, accessible design, and building software that real people can use.'),
  (311, 3, 'Group Software Project',          3, 'A team-based capstone project delivering a full software product from specification to deployment.'),
  (312, 3, 'Professional Practice',           3, 'Ethics in software engineering, intellectual property, careers, and preparation for industry.')
`).run();
console.log("✓ BSc Software Engineering modules ready");

// ─── Programme leader assignments ─────────────────────────────────────────────

db.prepare(`
  INSERT OR IGNORE INTO programme_leaders (programme_id, staff_id) VALUES
  (1, 1),  -- Dr Sarah Mitchell leads BSc Computer Science
  (2, 2),  -- Prof James Okafor leads MSc Cyber Security
  (3, 3)   -- Dr Priya Sharma leads BSc Software Engineering
`).run();
console.log("✓ Programme leaders assigned");

// ─── Module leader assignments ───────────────────────────────────────────────

db.prepare(`
  INSERT OR IGNORE INTO module_leaders (module_id, staff_id) VALUES
  -- BSc CS modules
  (101, 1),  -- Intro to Programming → Dr Mitchell
  (102, 5),  -- Web Technologies → Dr Brooks
  (103, 4),  -- Computer Systems → Dr Nguyen
  (104, 4),  -- Maths for Computing → Dr Nguyen
  (105, 4),  -- Data Structures → Dr Nguyen
  (106, 8),  -- Database Systems → Dr Reid
  (107, 1),  -- OO Software Design → Dr Mitchell
  (108, 2),  -- Networks and Protocols → Prof Okafor
  (109, 5),  -- Advanced Web Dev → Dr Brooks
  (110, 7),  -- Artificial Intelligence → Dr Barker
  (111, 1),  -- Final Year Project → Dr Mitchell
  (112, 8),  -- Distributed Systems → Dr Reid

  -- MSc Cyber Security modules
  (201, 2),  -- Network Security → Prof Okafor
  (202, 6),  -- Cryptography → Dr Al-Rashid
  (203, 6),  -- Ethical Hacking → Dr Al-Rashid
  (204, 2),  -- Digital Forensics → Prof Okafor
  (205, 6),  -- Malware Analysis → Dr Al-Rashid
  (206, 2),  -- Security Policy → Prof Okafor
  (207, 2),  -- MSc Dissertation → Prof Okafor

  -- BSc Software Engineering modules
  (301, 3),  -- Programming Fundamentals → Dr Sharma
  (302, 3),  -- SDLC → Dr Sharma
  (303, 5),  -- Version Control → Dr Brooks
  (304, 5),  -- Web Application Basics → Dr Brooks
  (305, 3),  -- Agile Dev → Dr Sharma
  (306, 4),  -- Testing and QA → Dr Nguyen
  (307, 8),  -- Software Architecture → Dr Reid
  (308, 8),  -- Database Design → Dr Reid
  (309, 5),  -- DevOps and Cloud → Dr Brooks
  (310, 7),  -- HCI → Dr Barker
  (311, 3),  -- Group Project → Dr Sharma
  (312, 1)   -- Professional Practice → Dr Mitchell
`).run();
console.log("✓ Module leaders assigned");

console.log("\n✔ Seed complete. Visit http://localhost:8000 to browse programmes.");
console.log("  Admin panel: http://localhost:8000/admin  (admin / admin123)");
console.log("  Staff portal: http://localhost:8000/staff/portal");

db.close();
