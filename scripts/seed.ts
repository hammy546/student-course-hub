/**
 * Run once to populate the database with an admin user and sample programmes.
 * deno task seed
 */
import { db } from "../db.ts";
import { hash } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

// Create admin user (change these credentials!)
const passwordHash = await hash("admin123");
db.prepare(
  "INSERT OR IGNORE INTO admins (username, password_hash) VALUES (?, ?)"
).run("admin", passwordHash);
console.log("Admin user created: admin / admin123");

// Sample programmes
db.prepare(`
  INSERT OR IGNORE INTO programmes (id, title, level, description, published) VALUES
  (1, 'BSc Computer Science', 'Undergraduate',
   'A comprehensive programme covering algorithms, software engineering, and systems programming.', 1),
  (2, 'MSc Cyber Security', 'Postgraduate',
   'Advanced study of network security, cryptography, and ethical hacking.', 1),
  (3, 'BSc Software Engineering', 'Undergraduate',
   'Focus on software development methodologies, testing, and project management.', 0)
`).run();

// Sample modules for programme 1
db.prepare(`
  INSERT OR IGNORE INTO modules (programme_id, title, year, description) VALUES
  (1, 'Introduction to Programming', 1, 'Python fundamentals and problem solving.'),
  (1, 'Web Technologies', 1, 'HTML, CSS, JavaScript and the browser platform.'),
  (1, 'Data Structures', 2, 'Arrays, trees, graphs and algorithm complexity.'),
  (1, 'Advanced Web Development', 3, 'Full-stack web applications with modern frameworks.')
`).run();

console.log("Sample data inserted.");
db.close();