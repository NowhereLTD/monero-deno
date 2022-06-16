import {Tests} from "../Tests.class.js";
addEventListener("load", async function() {
    tests = await new Tests();
    console.log(tests);
    await tests.run();
});