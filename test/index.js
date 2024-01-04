import { batch, effect, signal } from "../signal.js";

class Vec2 {
    x;
    y;
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
}

let id = signal(crypto.randomUUID());

/**@type {import("../signal.js").Signal<Vec2[]>} */
let vec_arr = signal([]);

effect(() => {
    console.log({ id: id.value, vectors: vec_arr.value });
});

vec_arr.push(new Vec2(0, 4), new Vec2(4, 5), new Vec2());

batch(() => {
    vec_arr.value = [];
    id.value = "clear";
});
