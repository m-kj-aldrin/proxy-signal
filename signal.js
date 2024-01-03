const intercept_methods = ["push", "splice", "shift", "pop"];

/**
 * @template T
 * @typedef {T extends number ? {value:number} : T extends string ? {value:string} : T extends boolean ? {value:boolean} : (T & {value:T}) } is_primitive
 */

/**@typedef {(init:boolean)=>void} ContextCallback */

/**@type {ContextCallback} */
let current_context;

let is_batching = false;
/**@type {Set<ContextCallback>} */
let batch_context = new Set();

/**
 * @template T
 * @typedef {ReturnType<typeof signal<T>>} Signal
 */

/**
 * @template {any} T
 * @param {T} init
 * @returns {is_primitive<T>}
 */
export function signal(init) {
  /**@type {Set<ContextCallback>} */
  let context_reference = new Set();

  if (
    typeof init == "number" ||
    typeof init == "string" ||
    typeof init == "boolean"
  ) {
    // let init = init;
    return {
      get value() {
        if (current_context != undefined) {
          context_reference.add(current_context);
        }

        return init;
      },
      set value(v) {
        init = v;

        if (is_batching) {
          context_reference.forEach((context) => batch_context.add(context));
        } else {
          context_reference.forEach((context) => context(false));
        }
      },
    };
  } else {
    /**@type {ProxyHandler} */
    let handler = {
      get(target, prop) {
        if (current_context != undefined) {
          context_reference.add(current_context);
        }

        if (intercept_methods.some((method) => prop == method)) {
          return function (...args) {
            let result = Reflect.apply(target[prop], target, args);

            if (is_batching) {
              context_reference.forEach((context) =>
                batch_context.add(context)
              );
            } else {
              context_reference.forEach((context) => context(false));
            }

            return result;
          };
        }

        if (prop == "value") {
          return init;
        }

        return Reflect.get(target, prop);
      },

      set(target, prop, newValue) {
        if (prop == "value") {
          try {
            if (typeof init != typeof newValue) {
              throw "new value needs to be of same type as intial value";
            } else if (init?.constructor != newValue?.constructor) {
              throw "new value needs to be of same type as intial value";
            }

            init = newValue;

            if (is_batching) {
              context_reference.forEach((context) =>
                batch_context.add(context)
              );
            } else {
              context_reference.forEach((context) => context(false));
            }

            return true;
          } catch (error) {
            console.error(error);
            return true;
          }
        }
      },
    };

    let proxy = new Proxy(init, handler);

    return proxy;
  }
}

/**@param {ContextCallback} fn */
export function effect(fn) {
  current_context = fn;
  fn(true);
  current_context = undefined;
}

export function batch(fn) {
  is_batching = true;
  fn();
  is_batching = false;
  batch_context.forEach((context) => context(false));
  batch_context.clear();
}
