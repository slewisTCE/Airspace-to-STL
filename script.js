const fs = require("fs");
const path = require("path");

// Path to the airspace data file
const filePath = path.join(__dirname, "Australian Airspace 28 November 2024_v1.txt");

// Read the file
const content = fs.readFileSync(filePath, "utf-8");

// Split file into blocks separated by blank lines
const blocks = content.split(/\n\s*\n/);

function extractAirspaceClasses() {
    const airspaceClasses = new Set(
        content
            .split("\n")
            .filter(line => line.startsWith("AC "))
            .map(line => line.slice(3).trim())
    );

    // console.log("\nUnique Airspace Classes:");
    airspaceClasses.forEach(cls => console.log(cls));
}

function extractAirspaceNames(filterClass = null) {
    const airspaceNames = [];

    blocks.forEach(block => {
        const lines = block.trim().split("\n");
        const nameLine = lines.find(line => line.startsWith("AN "));
        const classLine = lines.find(line => line.startsWith("AC "));

        if (nameLine) {
            const name = nameLine.slice(3).trim();
            const airspaceClass = classLine ? classLine.slice(3).trim() : null;

            if (!filterClass || airspaceClass === filterClass) {
                airspaceNames.push(name);
            }
        }
    });

    console.log(`Airspace Names${filterClass ? ` (Class ${filterClass})` : ''}:`);
    airspaceNames.forEach(name => console.log(name));
}

// CLI logic
const args = process.argv.slice(2); // Ignore 'node' and 'script.js'

const command = args[0];
const param = args[1]; // Optional (e.g. airspace class)

switch (command) {
    case "names":
        extractAirspaceNames(param);
        break;
    case "classes":
        extractAirspaceClasses();
        break;
    default:
        console.log("Usage:");
        console.log("  node script.js names [class]");
        console.log("  node script.js classes");
        break;
}