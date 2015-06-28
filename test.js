const out = process.stdout;
let n = 0;

const print = (n) => {
    //process.stdout.write("line " + n + "%\n" + "line " + n + "%\nline " + n + "%\n");
    console.log("line " + n + "%\n");
    console.log("line " + n + "%");
    console.log("line " + n + "%");
}

print(n++);

const handler = setInterval(() => {
    out.moveCursor(0,-4);
    out.clearLine();
    out.cursorTo(0);
    print(n++);
    if (n > 100) clearInterval(handler);
}, 100)

