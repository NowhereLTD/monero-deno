export class Monero {
  constructor() {
    return (async function () {
      let monero_javascript = {};
      var Module = typeof monero_javascript != "undefined" ? monero_javascript : {};
      var readyPromiseResolve, readyPromiseReject;
      Module["ready"] = new Promise(function(resolve, reject) {
          readyPromiseResolve = resolve;
          readyPromiseReject = reject
      });
      var moduleOverrides = Object.assign({}, Module);
      var arguments_ = [];
      var thisProgram = "./this.program";
      var quit_ = (status, toThrow) => {
          throw toThrow
      };
      var ENVIRONMENT_IS_WEB = typeof window == "object";
      var ENVIRONMENT_IS_WORKER = typeof importScripts == "function";
      var ENVIRONMENT_IS_NODE = typeof process == "object" && typeof process.versions == "object" && typeof process.versions.node == "string";
      var scriptDirectory = "";
      var _scriptDir = "../../src/";

      function locateFile(path) {
          if (Module["locateFile"]) {
              return Module["locateFile"](path, scriptDirectory)
          }
          return scriptDirectory + path
      }
      var read_, readAsync, readBinary, setWindowTitle;

      function logExceptionOnExit(e) {
          if (e instanceof ExitStatus) return;
          let toLog = e;
          err("exiting due to exception: " + toLog)
      }
      var fs;
      var nodePath;
      var requireNodeFS;
      if (ENVIRONMENT_IS_NODE) {
          if (ENVIRONMENT_IS_WORKER) {
              scriptDirectory = require("path").dirname(scriptDirectory) + "/"
          } else {
              scriptDirectory = __dirname + "/"
          }
          requireNodeFS = (() => {
              if (!nodePath) {
                  fs = require("fs");
                  nodePath = require("path")
              }
          });
          read_ = function shell_read(filename, binary) {
              requireNodeFS();
              filename = nodePath["normalize"](filename);
              return fs.readFileSync(filename, binary ? undefined : "utf8")
          };
          readBinary = (filename => {
              var ret = read_(filename, true);
              if (!ret.buffer) {
                  ret = new Uint8Array(ret)
              }
              return ret
          });
          readAsync = ((filename, onload, onerror) => {
              requireNodeFS();
              filename = nodePath["normalize"](filename);
              fs.readFile(filename, function(err, data) {
                  if (err) onerror(err);
                  else onload(data.buffer)
              })
          });
          if (process["argv"].length > 1) {
              thisProgram = process["argv"][1].replace(/\\/g, "/")
          }
          arguments_ = process["argv"].slice(2);
          process["on"]("unhandledRejection", function(reason) {
              throw reason
          });
          quit_ = ((status, toThrow) => {
              if (keepRuntimeAlive()) {
                  process["exitCode"] = status;
                  throw toThrow
              }
              logExceptionOnExit(toThrow);
              process["exit"](status)
          });
          Module["inspect"] = function() {
              return "[Emscripten Module object]"
          }
      } else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
          if (ENVIRONMENT_IS_WORKER) {
              scriptDirectory = self.location.href
          } else if (typeof document != "undefined" && document.currentScript) {
              scriptDirectory = document.currentScript.src
          }
          if (_scriptDir) {
              scriptDirectory = _scriptDir
          }
          if (scriptDirectory.indexOf("blob:") !== 0) {
              scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1)
          } else {
              scriptDirectory = ""
          } {
              read_ = (url => {
                  var xhr = new XMLHttpRequest;
                  xhr.open("GET", url, false);
                  xhr.send(null);
                  return xhr.responseText
              });
              if (ENVIRONMENT_IS_WORKER) {
                  readBinary = (url => {
                      var xhr = new XMLHttpRequest;
                      xhr.open("GET", url, false);
                      xhr.responseType = "arraybuffer";
                      xhr.send(null);
                      return new Uint8Array(xhr.response)
                  })
              }
              readAsync = ((url, onload, onerror) => {
                  var xhr = new XMLHttpRequest;
                  xhr.open("GET", url, true);
                  xhr.responseType = "arraybuffer";
                  xhr.onload = (() => {
                      if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
                          onload(xhr.response);
                          return
                      }
                      onerror()
                  });
                  xhr.onerror = onerror;
                  xhr.send(null)
              })
          }
          setWindowTitle = (title => document.title = title)
      } else {}
      var out = Module["print"] || console.log.bind(console);
      var err = Module["printErr"] || console.warn.bind(console);
      Object.assign(Module, moduleOverrides);
      moduleOverrides = null;
      if (Module["arguments"]) arguments_ = Module["arguments"];
      if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
      if (Module["quit"]) quit_ = Module["quit"];

      function uleb128Encode(n) {
          if (n < 128) {
              return [n]
          }
          return [n % 128 | 128, n >> 7]
      }

      function convertJsFunctionToWasm(func, sig) {
          if (typeof WebAssembly.Function == "function") {
              var typeNames = {
                  "i": "i32",
                  "j": "i64",
                  "f": "f32",
                  "d": "f64"
              };
              var type = {
                  parameters: [],
                  results: sig[0] == "v" ? [] : [typeNames[sig[0]]]
              };
              for (var i = 1; i < sig.length; ++i) {
                  type.parameters.push(typeNames[sig[i]])
              }
              return new WebAssembly.Function(type, func)
          }
          var typeSection = [1, 96];
          var sigRet = sig.slice(0, 1);
          var sigParam = sig.slice(1);
          var typeCodes = {
              "i": 127,
              "j": 126,
              "f": 125,
              "d": 124
          };
          typeSection = typeSection.concat(uleb128Encode(sigParam.length));
          for (var i = 0; i < sigParam.length; ++i) {
              typeSection.push(typeCodes[sigParam[i]])
          }
          if (sigRet == "v") {
              typeSection.push(0)
          } else {
              typeSection = typeSection.concat([1, typeCodes[sigRet]])
          }
          typeSection = [1].concat(uleb128Encode(typeSection.length), typeSection);
          var bytes = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0].concat(typeSection, [2, 7, 1, 1, 101, 1, 102, 0, 0, 7, 5, 1, 1, 102, 0, 0]));
          var module = new WebAssembly.Module(bytes);
          var instance = new WebAssembly.Instance(module, {
              "e": {
                  "f": func
              }
          });
          var wrappedFunc = instance.exports["f"];
          return wrappedFunc
      }
      var freeTableIndexes = [];
      var functionsInTableMap;

      function getEmptyTableSlot() {
          if (freeTableIndexes.length) {
              return freeTableIndexes.pop()
          }
          try {
              wasmTable.grow(1)
          } catch (err) {
              if (!(err instanceof RangeError)) {
                  throw err
              }
              throw "Unable to grow wasm table. Set ALLOW_TABLE_GROWTH."
          }
          return wasmTable.length - 1
      }

      function updateTableMap(offset, count) {
          for (var i = offset; i < offset + count; i++) {
              var item = getWasmTableEntry(i);
              if (item) {
                  functionsInTableMap.set(item, i)
              }
          }
      }

      function addFunction(func, sig) {
          if (!functionsInTableMap) {
              functionsInTableMap = new WeakMap;
              updateTableMap(0, wasmTable.length)
          }
          if (functionsInTableMap.has(func)) {
              return functionsInTableMap.get(func)
          }
          var ret = getEmptyTableSlot();
          try {
              setWasmTableEntry(ret, func)
          } catch (err) {
              if (!(err instanceof TypeError)) {
                  throw err
              }
              var wrapped = convertJsFunctionToWasm(func, sig);
              setWasmTableEntry(ret, wrapped)
          }
          functionsInTableMap.set(func, ret);
          return ret
      }
      var tempRet0 = 0;
      var setTempRet0 = value => {
          tempRet0 = value
      };
      var getTempRet0 = () => tempRet0;
      var wasmBinary;
      if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];
      var noExitRuntime = Module["noExitRuntime"] || true;
      if (typeof WebAssembly != "object") {
          abort("no native wasm support detected")
      }
      var wasmMemory;
      var ABORT = false;
      var EXITSTATUS;

      function assert(condition, text) {
          if (!condition) {
              abort(text)
          }
      }
      var UTF8Decoder = typeof TextDecoder != "undefined" ? new TextDecoder("utf8") : undefined;

      function UTF8ArrayToString(heapOrArray, idx, maxBytesToRead) {
          var endIdx = idx + maxBytesToRead;
          var endPtr = idx;
          while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
          if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
              return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr))
          } else {
              var str = "";
              while (idx < endPtr) {
                  var u0 = heapOrArray[idx++];
                  if (!(u0 & 128)) {
                      str += String.fromCharCode(u0);
                      continue
                  }
                  var u1 = heapOrArray[idx++] & 63;
                  if ((u0 & 224) == 192) {
                      str += String.fromCharCode((u0 & 31) << 6 | u1);
                      continue
                  }
                  var u2 = heapOrArray[idx++] & 63;
                  if ((u0 & 240) == 224) {
                      u0 = (u0 & 15) << 12 | u1 << 6 | u2
                  } else {
                      u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heapOrArray[idx++] & 63
                  }
                  if (u0 < 65536) {
                      str += String.fromCharCode(u0)
                  } else {
                      var ch = u0 - 65536;
                      str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023)
                  }
              }
          }
          return str
      }

      function UTF8ToString(ptr, maxBytesToRead) {
          return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : ""
      }

      function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
          if (!(maxBytesToWrite > 0)) return 0;
          var startIdx = outIdx;
          var endIdx = outIdx + maxBytesToWrite - 1;
          for (var i = 0; i < str.length; ++i) {
              var u = str.charCodeAt(i);
              if (u >= 55296 && u <= 57343) {
                  var u1 = str.charCodeAt(++i);
                  u = 65536 + ((u & 1023) << 10) | u1 & 1023
              }
              if (u <= 127) {
                  if (outIdx >= endIdx) break;
                  heap[outIdx++] = u
              } else if (u <= 2047) {
                  if (outIdx + 1 >= endIdx) break;
                  heap[outIdx++] = 192 | u >> 6;
                  heap[outIdx++] = 128 | u & 63
              } else if (u <= 65535) {
                  if (outIdx + 2 >= endIdx) break;
                  heap[outIdx++] = 224 | u >> 12;
                  heap[outIdx++] = 128 | u >> 6 & 63;
                  heap[outIdx++] = 128 | u & 63
              } else {
                  if (outIdx + 3 >= endIdx) break;
                  heap[outIdx++] = 240 | u >> 18;
                  heap[outIdx++] = 128 | u >> 12 & 63;
                  heap[outIdx++] = 128 | u >> 6 & 63;
                  heap[outIdx++] = 128 | u & 63
              }
          }
          heap[outIdx] = 0;
          return outIdx - startIdx
      }

      function stringToUTF8(str, outPtr, maxBytesToWrite) {
          return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite)
      }

      function lengthBytesUTF8(str) {
          var len = 0;
          for (var i = 0; i < str.length; ++i) {
              var u = str.charCodeAt(i);
              if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
              if (u <= 127) ++len;
              else if (u <= 2047) len += 2;
              else if (u <= 65535) len += 3;
              else len += 4
          }
          return len
      }
      var UTF16Decoder = typeof TextDecoder != "undefined" ? new TextDecoder("utf-16le") : undefined;

      function UTF16ToString(ptr, maxBytesToRead) {
          var endPtr = ptr;
          var idx = endPtr >> 1;
          var maxIdx = idx + maxBytesToRead / 2;
          while (!(idx >= maxIdx) && HEAPU16[idx]) ++idx;
          endPtr = idx << 1;
          if (endPtr - ptr > 32 && UTF16Decoder) {
              return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr))
          } else {
              var str = "";
              for (var i = 0; !(i >= maxBytesToRead / 2); ++i) {
                  var codeUnit = HEAP16[ptr + i * 2 >> 1];
                  if (codeUnit == 0) break;
                  str += String.fromCharCode(codeUnit)
              }
              return str
          }
      }

      function stringToUTF16(str, outPtr, maxBytesToWrite) {
          if (maxBytesToWrite === undefined) {
              maxBytesToWrite = 2147483647
          }
          if (maxBytesToWrite < 2) return 0;
          maxBytesToWrite -= 2;
          var startPtr = outPtr;
          var numCharsToWrite = maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;
          for (var i = 0; i < numCharsToWrite; ++i) {
              var codeUnit = str.charCodeAt(i);
              HEAP16[outPtr >> 1] = codeUnit;
              outPtr += 2
          }
          HEAP16[outPtr >> 1] = 0;
          return outPtr - startPtr
      }

      function lengthBytesUTF16(str) {
          return str.length * 2
      }

      function UTF32ToString(ptr, maxBytesToRead) {
          var i = 0;
          var str = "";
          while (!(i >= maxBytesToRead / 4)) {
              var utf32 = HEAP32[ptr + i * 4 >> 2];
              if (utf32 == 0) break;
              ++i;
              if (utf32 >= 65536) {
                  var ch = utf32 - 65536;
                  str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023)
              } else {
                  str += String.fromCharCode(utf32)
              }
          }
          return str
      }

      function stringToUTF32(str, outPtr, maxBytesToWrite) {
          if (maxBytesToWrite === undefined) {
              maxBytesToWrite = 2147483647
          }
          if (maxBytesToWrite < 4) return 0;
          var startPtr = outPtr;
          var endPtr = startPtr + maxBytesToWrite - 4;
          for (var i = 0; i < str.length; ++i) {
              var codeUnit = str.charCodeAt(i);
              if (codeUnit >= 55296 && codeUnit <= 57343) {
                  var trailSurrogate = str.charCodeAt(++i);
                  codeUnit = 65536 + ((codeUnit & 1023) << 10) | trailSurrogate & 1023
              }
              HEAP32[outPtr >> 2] = codeUnit;
              outPtr += 4;
              if (outPtr + 4 > endPtr) break
          }
          HEAP32[outPtr >> 2] = 0;
          return outPtr - startPtr
      }

      function lengthBytesUTF32(str) {
          var len = 0;
          for (var i = 0; i < str.length; ++i) {
              var codeUnit = str.charCodeAt(i);
              if (codeUnit >= 55296 && codeUnit <= 57343) ++i;
              len += 4
          }
          return len
      }

      function allocateUTF8(str) {
          var size = lengthBytesUTF8(str) + 1;
          var ret = _malloc(size);
          if (ret) stringToUTF8Array(str, HEAP8, ret, size);
          return ret
      }

      function writeArrayToMemory(array, buffer) {
          HEAP8.set(array, buffer)
      }

      function writeAsciiToMemory(str, buffer, dontAddNull) {
          for (var i = 0; i < str.length; ++i) {
              HEAP8[buffer++ >> 0] = str.charCodeAt(i)
          }
          if (!dontAddNull) HEAP8[buffer >> 0] = 0
      }
      var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

      function updateGlobalBufferAndViews(buf) {
          buffer = buf;
          Module["HEAP8"] = HEAP8 = new Int8Array(buf);
          Module["HEAP16"] = HEAP16 = new Int16Array(buf);
          Module["HEAP32"] = HEAP32 = new Int32Array(buf);
          Module["HEAPU8"] = HEAPU8 = new Uint8Array(buf);
          Module["HEAPU16"] = HEAPU16 = new Uint16Array(buf);
          Module["HEAPU32"] = HEAPU32 = new Uint32Array(buf);
          Module["HEAPF32"] = HEAPF32 = new Float32Array(buf);
          Module["HEAPF64"] = HEAPF64 = new Float64Array(buf)
      }
      var INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 16777216;
      var wasmTable;
      var __ATPRERUN__ = [];
      var __ATINIT__ = [];
      var __ATPOSTRUN__ = [];
      var runtimeInitialized = false;

      function keepRuntimeAlive() {
          return noExitRuntime
      }

      function preRun() {
          if (Module["preRun"]) {
              if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];
              while (Module["preRun"].length) {
                  addOnPreRun(Module["preRun"].shift())
              }
          }
          callRuntimeCallbacks(__ATPRERUN__)
      }

      function initRuntime() {
          runtimeInitialized = true;
          if (!Module["noFSInit"] && !FS.init.initialized) FS.init();
          FS.ignorePermissions = false;
          TTY.init();
          callRuntimeCallbacks(__ATINIT__)
      }

      function postRun() {
          if (Module["postRun"]) {
              if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];
              while (Module["postRun"].length) {
                  addOnPostRun(Module["postRun"].shift())
              }
          }
          callRuntimeCallbacks(__ATPOSTRUN__)
      }

      function addOnPreRun(cb) {
          __ATPRERUN__.unshift(cb)
      }

      function addOnInit(cb) {
          __ATINIT__.unshift(cb)
      }

      function addOnPostRun(cb) {
          __ATPOSTRUN__.unshift(cb)
      }
      var runDependencies = 0;
      var runDependencyWatcher = null;
      var dependenciesFulfilled = null;

      function getUniqueRunDependency(id) {
          return id
      }

      function addRunDependency(id) {
          runDependencies++;
          if (Module["monitorRunDependencies"]) {
              Module["monitorRunDependencies"](runDependencies)
          }
      }

      function removeRunDependency(id) {
          runDependencies--;
          if (Module["monitorRunDependencies"]) {
              Module["monitorRunDependencies"](runDependencies)
          }
          if (runDependencies == 0) {
              if (runDependencyWatcher !== null) {
                  clearInterval(runDependencyWatcher);
                  runDependencyWatcher = null
              }
              if (dependenciesFulfilled) {
                  var callback = dependenciesFulfilled;
                  dependenciesFulfilled = null;
                  callback()
              }
          }
      }

      function abort(what) {
          {
              if (Module["onAbort"]) {
                  Module["onAbort"](what)
              }
          }
          what = "Aborted(" + what + ")";
          err(what);
          ABORT = true;
          EXITSTATUS = 1;
          what += ". Build with -sASSERTIONS for more info.";
          var e = new WebAssembly.RuntimeError(what);
          readyPromiseReject(e);
          throw e
      }
      var dataURIPrefix = "data:application/octet-stream;base64,";

      function isDataURI(filename) {
          return filename.startsWith(dataURIPrefix)
      }

      function isFileURI(filename) {
          return filename.startsWith("file://")
      }
      var wasmBinaryFile;
      wasmBinaryFile = "monero_wallet_full.wasm";
      if (!isDataURI(wasmBinaryFile)) {
          wasmBinaryFile = locateFile(wasmBinaryFile)
      }

      function getBinary(file) {
          try {
              if (file == wasmBinaryFile && wasmBinary) {
                  return new Uint8Array(wasmBinary)
              }
              if (readBinary) {
                  return readBinary(file)
              } else {
                  throw "both async and sync fetching of the wasm failed"
              }
          } catch (err) {
              abort(err)
          }
      }

      function getBinaryPromise() {
          if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
              if (typeof fetch == "function" && !isFileURI(wasmBinaryFile)) {
                  return fetch(wasmBinaryFile, {
                      credentials: "same-origin"
                  }).then(function(response) {
                      if (!response["ok"]) {
                          throw "failed to load wasm binary file at '" + wasmBinaryFile + "'"
                      }
                      return response["arrayBuffer"]()
                  }).catch(function() {
                      return getBinary(wasmBinaryFile)
                  })
              } else {
                  if (readAsync) {
                      return new Promise(function(resolve, reject) {
                          readAsync(wasmBinaryFile, function(response) {
                              resolve(new Uint8Array(response))
                          }, reject)
                      })
                  }
              }
          }
          return Promise.resolve().then(function() {
              return getBinary(wasmBinaryFile)
          })
      }

      function createWasm() {
          var info = {
              "a": asmLibraryArg
          };

          function receiveInstance(instance, module) {
              var exports = instance.exports;
              exports = Asyncify.instrumentWasmExports(exports);
              Module["asm"] = exports;
              wasmMemory = Module["asm"]["sb"];
              updateGlobalBufferAndViews(wasmMemory.buffer);
              wasmTable = Module["asm"]["vb"];
              addOnInit(Module["asm"]["tb"]);
              removeRunDependency("wasm-instantiate")
          }
          addRunDependency("wasm-instantiate");

          function receiveInstantiationResult(result) {
              receiveInstance(result["instance"])
          }

          function instantiateArrayBuffer(receiver) {
              return getBinaryPromise().then(function(binary) {
                  return WebAssembly.instantiate(binary, info)
              }).then(function(instance) {
                  return instance
              }).then(receiver, function(reason) {
                  err("failed to asynchronously prepare wasm: " + reason);
                  abort(reason)
              })
          }

          function instantiateAsync() {
              if (!wasmBinary && typeof WebAssembly.instantiateStreaming == "function" && !isDataURI(wasmBinaryFile) && !isFileURI(wasmBinaryFile) && typeof fetch == "function") {
                  return fetch(wasmBinaryFile, {
                      credentials: "same-origin"
                  }).then(function(response) {
                      var result = WebAssembly.instantiateStreaming(response, info);
                      return result.then(receiveInstantiationResult, function(reason) {
                          err("wasm streaming compile failed: " + reason);
                          err("falling back to ArrayBuffer instantiation");
                          return instantiateArrayBuffer(receiveInstantiationResult)
                      })
                  })
              } else {
                  return instantiateArrayBuffer(receiveInstantiationResult)
              }
          }
          if (Module["instantiateWasm"]) {
              try {
                  var exports = Module["instantiateWasm"](info, receiveInstance);
                  exports = Asyncify.instrumentWasmExports(exports);
                  return exports
              } catch (e) {
                  err("Module.instantiateWasm callback failed with error: " + e);
                  return false
              }
          }
          instantiateAsync().catch(readyPromiseReject);
          return {}
      }
      var tempDouble;
      var tempI64;

      function js_send_binary_request(uri, username, password, reject_unauthorized_fn_id, method, body, body_length, timeout) {
          const monerojs = require("../index");
          const HttpClient = monerojs.HttpClient;
          const LibraryUtils = monerojs.LibraryUtils;
          const GenUtils = monerojs.GenUtils;
          return Asyncify.handleSleep(function(wakeUp) {
              LibraryUtils.loadFullModule().then(module => {
                  let ptr = body;
                  let length = body_length;
                  let view = new Uint8Array(length);
                  for (let i = 0; i < length; i++) {
                      view[i] = Module.HEAPU8[ptr / Uint8Array.BYTES_PER_ELEMENT + i]
                  }
                  let wakeUpCalled = false;
                  HttpClient.request({
                      method: UTF8ToString(method),
                      uri: UTF8ToString(uri),
                      username: UTF8ToString(username),
                      password: UTF8ToString(password),
                      body: view,
                      resolveWithFullResponse: true,
                      rejectUnauthorized: LibraryUtils.isRejectUnauthorized(UTF8ToString(reject_unauthorized_fn_id)),
                      requestApi: GenUtils.isFirefox() ? "xhr" : "fetch"
                  }).then(resp => {
                      let respBin = resp.body;
                      if (!(respBin instanceof Uint8Array)) {
                          console.error("resp is not uint8array");
                          console.error(respBin)
                      }
                      let nDataBytes = respBin.length * respBin.BYTES_PER_ELEMENT;
                      let bodyPtr = Module._malloc(nDataBytes);
                      let heap = new Uint8Array(Module.HEAPU8.buffer, bodyPtr, nDataBytes);
                      heap.set(new Uint8Array(respBin.buffer, respBin.byteOffset, nDataBytes));
                      let respContainer = {
                          code: resp.statusCode,
                          message: resp.statusText,
                          headers: resp.headers,
                          bodyPtr: bodyPtr,
                          bodyLength: respBin.length
                      };
                      let respStr = JSON.stringify(respContainer);
                      let lengthBytes = Module.lengthBytesUTF8(respStr) + 1;
                      let ptr = Module._malloc(lengthBytes);
                      Module.stringToUTF8(respStr, ptr, lengthBytes);
                      wakeUpCalled = true;
                      wakeUp(ptr)
                  }).catch(err => {
                      if (wakeUpCalled) {
                          console.error("Error caught in JS after previously calling wakeUp(): " + err);
                          throw new Error("Error caught in JS after previously calling wakeUp(): " + err)
                      }
                      let str = err.message ? err.message : "" + err;
                      str = JSON.stringify({
                          error: str
                      });
                      let lengthBytes = Module.lengthBytesUTF8(str) + 1;
                      let ptr = Module._malloc(lengthBytes);
                      Module.stringToUTF8(str, ptr, lengthBytes);
                      wakeUpCalled = true;
                      wakeUp(ptr)
                  })
              }).catch(err => {
                  throw new Error("Could not load full wasm module")
              })
          })
      }

      function js_send_json_request(uri, username, password, reject_unauthorized_fn_id, method, body, timeout) {
          const monerojs = require("../index");
          const HttpClient = monerojs.HttpClient;
          const LibraryUtils = monerojs.LibraryUtils;
          const GenUtils = monerojs.GenUtils;
          return Asyncify.handleSleep(function(wakeUp) {
              let wakeUpCalled = false;
              HttpClient.request({
                  method: UTF8ToString(method),
                  uri: UTF8ToString(uri),
                  username: UTF8ToString(username),
                  password: UTF8ToString(password),
                  body: UTF8ToString(body),
                  resolveWithFullResponse: true,
                  rejectUnauthorized: LibraryUtils.isRejectUnauthorized(UTF8ToString(reject_unauthorized_fn_id)),
                  requestApi: GenUtils.isFirefox() ? "xhr" : "fetch"
              }).then(resp => {
                  let respContainer = {
                      code: resp.statusCode,
                      message: resp.statusText,
                      body: resp.body,
                      headers: resp.headers
                  };
                  let respStr = JSON.stringify(respContainer);
                  let lengthBytes = Module.lengthBytesUTF8(respStr) + 1;
                  let ptr = Module._malloc(lengthBytes);
                  Module.stringToUTF8(respStr, ptr, lengthBytes);
                  wakeUpCalled = true;
                  wakeUp(ptr)
              }).catch(err => {
                  if (wakeUpCalled) {
                      console.error("Error caught in JS after previously calling wakeUp(): " + err);
                      throw new Error("Error caught in JS after previously calling wakeUp(): " + err)
                  }
                  let str = err.message ? err.message : "" + err;
                  str = JSON.stringify({
                      error: str
                  });
                  let lengthBytes = Module.lengthBytesUTF8(str) + 1;
                  let ptr = Module._malloc(lengthBytes);
                  Module.stringToUTF8(str, ptr, lengthBytes);
                  wakeUpCalled = true;
                  wakeUp(ptr)
              })
          })
      }

      function callRuntimeCallbacks(callbacks) {
          while (callbacks.length > 0) {
              var callback = callbacks.shift();
              if (typeof callback == "function") {
                  callback(Module);
                  continue
              }
              var func = callback.func;
              if (typeof func == "number") {
                  if (callback.arg === undefined) {
                      (function() {
                          dynCall_v.call(null, func)
                      })()
                  } else {
                      (function(a1) {
                          dynCall_vi.apply(null, [func, a1])
                      })(callback.arg)
                  }
              } else {
                  func(callback.arg === undefined ? null : callback.arg)
              }
          }
      }

      function getWasmTableEntry(funcPtr) {
          return wasmTable.get(funcPtr)
      }

      function handleException(e) {
          if (e instanceof ExitStatus || e == "unwind") {
              return EXITSTATUS
          }
          quit_(1, e)
      }

      function setWasmTableEntry(idx, func) {
          wasmTable.set(idx, func)
      }

      function _BIO_free() {
          err("missing function: BIO_free");
          abort(-1)
      }

      function _BIO_new_mem_buf() {
          err("missing function: BIO_new_mem_buf");
          abort(-1)
      }

      function _CONF_modules_unload() {
          err("missing function: CONF_modules_unload");
          abort(-1)
      }

      function _CRYPTO_free() {
          err("missing function: CRYPTO_free");
          abort(-1)
      }

      function _ERR_reason_error_string() {
          err("missing function: ERR_reason_error_string");
          abort(-1)
      }

      function _PEM_read_bio() {
          err("missing function: PEM_read_bio");
          abort(-1)
      }

      function _PEM_write() {
          err("missing function: PEM_write");
          abort(-1)
      }

      function __ZN2hw6trezor12register_allEv() {
          err("missing function: _ZN2hw6trezor12register_allEv");
          abort(-1)
      }

      function __ZN5boost10filesystem6detail12current_pathEPNS_6system10error_codeE() {
          err("missing function: _ZN5boost10filesystem6detail12current_pathEPNS_6system10error_codeE");
          abort(-1)
      }

      function __ZN5boost10filesystem6detail18create_directoriesERKNS0_4pathEPNS_6system10error_codeE() {
          err("missing function: _ZN5boost10filesystem6detail18create_directoriesERKNS0_4pathEPNS_6system10error_codeE");
          abort(-1)
      }

      function __ZN5boost10filesystem6detail5spaceERKNS0_4pathEPNS_6system10error_codeE() {
          err("missing function: _ZN5boost10filesystem6detail5spaceERKNS0_4pathEPNS_6system10error_codeE");
          abort(-1)
      }

      function __ZN5boost10filesystem6detail6removeERKNS0_4pathEPNS_6system10error_codeE() {
          err("missing function: _ZN5boost10filesystem6detail6removeERKNS0_4pathEPNS_6system10error_codeE");
          abort(-1)
      }

      function __ZN5boost10filesystem6detail6statusERKNS0_4pathEPNS_6system10error_codeE() {
          err("missing function: _ZN5boost10filesystem6detail6statusERKNS0_4pathEPNS_6system10error_codeE");
          abort(-1)
      }

      function __ZN5boost10filesystem6detail9canonicalERKNS0_4pathES4_PNS_6system10error_codeE() {
          err("missing function: _ZN5boost10filesystem6detail9canonicalERKNS0_4pathES4_PNS_6system10error_codeE");
          abort(-1)
      }

      function __ZN5boost10filesystem6detail9copy_fileERKNS0_4pathES4_jPNS_6system10error_codeE() {
          err("missing function: _ZN5boost10filesystem6detail9copy_fileERKNS0_4pathES4_jPNS_6system10error_codeE");
          abort(-1)
      }

      function __ZN5tools9dns_utils25load_txt_records_from_dnsERNSt3__26vectorINS1_12basic_stringIcNS1_11char_traitsIcEENS1_9allocatorIcEEEENS6_IS8_EEEERKSA_() {
          err("missing function: _ZN5tools9dns_utils25load_txt_records_from_dnsERNSt3__26vectorINS1_12basic_stringIcNS1_11char_traitsIcEENS1_9allocatorIcEEEENS6_IS8_EEEERKSA_");
          abort(-1)
      }

      function __ZNK5boost10filesystem4path11parent_pathEv() {
          err("missing function: _ZNK5boost10filesystem4path11parent_pathEv");
          abort(-1)
      }

      function __ZNK5tools6Notify6notifyEPKcS2_z() {
          err("missing function: _ZNK5tools6Notify6notifyEPKcS2_z");
          abort(-1)
      }

      function ___assert_fail(condition, filename, line, func) {
          abort("Assertion failed: " + UTF8ToString(condition) + ", at: " + [filename ? UTF8ToString(filename) : "unknown filename", line, func ? UTF8ToString(func) : "unknown function"])
      }

      function ___cxa_allocate_exception(size) {
          return _malloc(size + 24) + 24
      }
      var exceptionCaught = [];

      function exception_addRef(info) {
          info.add_ref()
      }
      var uncaughtExceptionCount = 0;

      function ___cxa_begin_catch(ptr) {
          var info = new ExceptionInfo(ptr);
          if (!info.get_caught()) {
              info.set_caught(true);
              uncaughtExceptionCount--
          }
          info.set_rethrown(false);
          exceptionCaught.push(info);
          exception_addRef(info);
          return info.get_exception_ptr()
      }

      function ExceptionInfo(excPtr) {
          this.excPtr = excPtr;
          this.ptr = excPtr - 24;
          this.set_type = function(type) {
              HEAPU32[this.ptr + 4 >> 2] = type
          };
          this.get_type = function() {
              return HEAPU32[this.ptr + 4 >> 2]
          };
          this.set_destructor = function(destructor) {
              HEAPU32[this.ptr + 8 >> 2] = destructor
          };
          this.get_destructor = function() {
              return HEAPU32[this.ptr + 8 >> 2]
          };
          this.set_refcount = function(refcount) {
              HEAP32[this.ptr >> 2] = refcount
          };
          this.set_caught = function(caught) {
              caught = caught ? 1 : 0;
              HEAP8[this.ptr + 12 >> 0] = caught
          };
          this.get_caught = function() {
              return HEAP8[this.ptr + 12 >> 0] != 0
          };
          this.set_rethrown = function(rethrown) {
              rethrown = rethrown ? 1 : 0;
              HEAP8[this.ptr + 13 >> 0] = rethrown
          };
          this.get_rethrown = function() {
              return HEAP8[this.ptr + 13 >> 0] != 0
          };
          this.init = function(type, destructor) {
              this.set_adjusted_ptr(0);
              this.set_type(type);
              this.set_destructor(destructor);
              this.set_refcount(0);
              this.set_caught(false);
              this.set_rethrown(false)
          };
          this.add_ref = function() {
              var value = HEAP32[this.ptr >> 2];
              HEAP32[this.ptr >> 2] = value + 1
          };
          this.release_ref = function() {
              var prev = HEAP32[this.ptr >> 2];
              HEAP32[this.ptr >> 2] = prev - 1;
              return prev === 1
          };
          this.set_adjusted_ptr = function(adjustedPtr) {
              HEAPU32[this.ptr + 16 >> 2] = adjustedPtr
          };
          this.get_adjusted_ptr = function() {
              return HEAPU32[this.ptr + 16 >> 2]
          };
          this.get_exception_ptr = function() {
              var isPointer = ___cxa_is_pointer_type(this.get_type());
              if (isPointer) {
                  return HEAPU32[this.excPtr >> 2]
              }
              var adjusted = this.get_adjusted_ptr();
              if (adjusted !== 0) return adjusted;
              return this.excPtr
          }
      }

      function ___cxa_free_exception(ptr) {
          return _free(new ExceptionInfo(ptr).ptr)
      }

      function exception_decRef(info) {
          if (info.release_ref() && !info.get_rethrown()) {
              var destructor = info.get_destructor();
              if (destructor) {
                  (function(a1) {
                      return dynCall_ii.apply(null, [destructor, a1])
                  })(info.excPtr)
              }
              ___cxa_free_exception(info.excPtr)
          }
      }

      function ___cxa_decrement_exception_refcount(ptr) {
          if (!ptr) return;
          exception_decRef(new ExceptionInfo(ptr))
      }
      var exceptionLast = 0;

      function ___cxa_end_catch() {
          _setThrew(0);
          var info = exceptionCaught.pop();
          exception_decRef(info);
          exceptionLast = 0
      }

      function ___resumeException(ptr) {
          if (!exceptionLast) {
              exceptionLast = ptr
          }
          throw ptr
      }

      function ___cxa_find_matching_catch_2() {
          var thrown = exceptionLast;
          if (!thrown) {
              setTempRet0(0);
              return 0
          }
          var info = new ExceptionInfo(thrown);
          info.set_adjusted_ptr(thrown);
          var thrownType = info.get_type();
          if (!thrownType) {
              setTempRet0(0);
              return thrown
          }
          var typeArray = Array.prototype.slice.call(arguments);
          for (var i = 0; i < typeArray.length; i++) {
              var caughtType = typeArray[i];
              if (caughtType === 0 || caughtType === thrownType) {
                  break
              }
              var adjusted_ptr_addr = info.ptr + 16;
              if (___cxa_can_catch(caughtType, thrownType, adjusted_ptr_addr)) {
                  setTempRet0(caughtType);
                  return thrown
              }
          }
          setTempRet0(thrownType);
          return thrown
      }

      function ___cxa_find_matching_catch_3() {
          var thrown = exceptionLast;
          if (!thrown) {
              setTempRet0(0);
              return 0
          }
          var info = new ExceptionInfo(thrown);
          info.set_adjusted_ptr(thrown);
          var thrownType = info.get_type();
          if (!thrownType) {
              setTempRet0(0);
              return thrown
          }
          var typeArray = Array.prototype.slice.call(arguments);
          for (var i = 0; i < typeArray.length; i++) {
              var caughtType = typeArray[i];
              if (caughtType === 0 || caughtType === thrownType) {
                  break
              }
              var adjusted_ptr_addr = info.ptr + 16;
              if (___cxa_can_catch(caughtType, thrownType, adjusted_ptr_addr)) {
                  setTempRet0(caughtType);
                  return thrown
              }
          }
          setTempRet0(thrownType);
          return thrown
      }

      function ___cxa_find_matching_catch_5() {
          var thrown = exceptionLast;
          if (!thrown) {
              setTempRet0(0);
              return 0
          }
          var info = new ExceptionInfo(thrown);
          info.set_adjusted_ptr(thrown);
          var thrownType = info.get_type();
          if (!thrownType) {
              setTempRet0(0);
              return thrown
          }
          var typeArray = Array.prototype.slice.call(arguments);
          for (var i = 0; i < typeArray.length; i++) {
              var caughtType = typeArray[i];
              if (caughtType === 0 || caughtType === thrownType) {
                  break
              }
              var adjusted_ptr_addr = info.ptr + 16;
              if (___cxa_can_catch(caughtType, thrownType, adjusted_ptr_addr)) {
                  setTempRet0(caughtType);
                  return thrown
              }
          }
          setTempRet0(thrownType);
          return thrown
      }

      function ___cxa_find_matching_catch_6() {
          var thrown = exceptionLast;
          if (!thrown) {
              setTempRet0(0);
              return 0
          }
          var info = new ExceptionInfo(thrown);
          info.set_adjusted_ptr(thrown);
          var thrownType = info.get_type();
          if (!thrownType) {
              setTempRet0(0);
              return thrown
          }
          var typeArray = Array.prototype.slice.call(arguments);
          for (var i = 0; i < typeArray.length; i++) {
              var caughtType = typeArray[i];
              if (caughtType === 0 || caughtType === thrownType) {
                  break
              }
              var adjusted_ptr_addr = info.ptr + 16;
              if (___cxa_can_catch(caughtType, thrownType, adjusted_ptr_addr)) {
                  setTempRet0(caughtType);
                  return thrown
              }
          }
          setTempRet0(thrownType);
          return thrown
      }

      function ___cxa_increment_exception_refcount(ptr) {
          if (!ptr) return;
          exception_addRef(new ExceptionInfo(ptr))
      }

      function ___cxa_rethrow() {
          var info = exceptionCaught.pop();
          if (!info) {
              abort("no exception to throw")
          }
          var ptr = info.excPtr;
          if (!info.get_rethrown()) {
              exceptionCaught.push(info);
              info.set_rethrown(true);
              info.set_caught(false);
              uncaughtExceptionCount++
          }
          exceptionLast = ptr;
          throw ptr
      }

      function ___cxa_rethrow_primary_exception(ptr) {
          if (!ptr) return;
          var info = new ExceptionInfo(ptr);
          exceptionCaught.push(info);
          info.set_rethrown(true);
          ___cxa_rethrow()
      }

      function ___cxa_throw(ptr, type, destructor) {
          var info = new ExceptionInfo(ptr);
          info.init(type, destructor);
          exceptionLast = ptr;
          uncaughtExceptionCount++;
          throw ptr
      }

      function ___cxa_uncaught_exceptions() {
          return uncaughtExceptionCount
      }

      function setErrNo(value) {
          HEAP32[___errno_location() >> 2] = value;
          return value
      }
      var PATH = {
          isAbs: path => path.charAt(0) === "/",
          splitPath: filename => {
              var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
              return splitPathRe.exec(filename).slice(1)
          },
          normalizeArray: (parts, allowAboveRoot) => {
              var up = 0;
              for (var i = parts.length - 1; i >= 0; i--) {
                  var last = parts[i];
                  if (last === ".") {
                      parts.splice(i, 1)
                  } else if (last === "..") {
                      parts.splice(i, 1);
                      up++
                  } else if (up) {
                      parts.splice(i, 1);
                      up--
                  }
              }
              if (allowAboveRoot) {
                  for (; up; up--) {
                      parts.unshift("..")
                  }
              }
              return parts
          },
          normalize: path => {
              var isAbsolute = PATH.isAbs(path),
                  trailingSlash = path.substr(-1) === "/";
              path = PATH.normalizeArray(path.split("/").filter(p => !!p), !isAbsolute).join("/");
              if (!path && !isAbsolute) {
                  path = "."
              }
              if (path && trailingSlash) {
                  path += "/"
              }
              return (isAbsolute ? "/" : "") + path
          },
          dirname: path => {
              var result = PATH.splitPath(path),
                  root = result[0],
                  dir = result[1];
              if (!root && !dir) {
                  return "."
              }
              if (dir) {
                  dir = dir.substr(0, dir.length - 1)
              }
              return root + dir
          },
          basename: path => {
              if (path === "/") return "/";
              path = PATH.normalize(path);
              path = path.replace(/\/$/, "");
              var lastSlash = path.lastIndexOf("/");
              if (lastSlash === -1) return path;
              return path.substr(lastSlash + 1)
          },
          join: function() {
              var paths = Array.prototype.slice.call(arguments, 0);
              return PATH.normalize(paths.join("/"))
          },
          join2: (l, r) => {
              return PATH.normalize(l + "/" + r)
          }
      };

      function getRandomDevice() {
          if (typeof crypto == "object" && typeof crypto["getRandomValues"] == "function") {
              var randomBuffer = new Uint8Array(1);
              return function() {
                  crypto.getRandomValues(randomBuffer);
                  return randomBuffer[0]
              }
          } else if (ENVIRONMENT_IS_NODE) {
              try {
                  var crypto_module = require("crypto");
                  return function() {
                      return crypto_module["randomBytes"](1)[0]
                  }
              } catch (e) {}
          }
          return function() {
              abort("randomDevice")
          }
      }
      var PATH_FS = {
          resolve: function() {
              var resolvedPath = "",
                  resolvedAbsolute = false;
              for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
                  var path = i >= 0 ? arguments[i] : FS.cwd();
                  if (typeof path != "string") {
                      throw new TypeError("Arguments to path.resolve must be strings")
                  } else if (!path) {
                      return ""
                  }
                  resolvedPath = path + "/" + resolvedPath;
                  resolvedAbsolute = PATH.isAbs(path)
              }
              resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter(p => !!p), !resolvedAbsolute).join("/");
              return (resolvedAbsolute ? "/" : "") + resolvedPath || "."
          },
          relative: (from, to) => {
              from = PATH_FS.resolve(from).substr(1);
              to = PATH_FS.resolve(to).substr(1);

              function trim(arr) {
                  var start = 0;
                  for (; start < arr.length; start++) {
                      if (arr[start] !== "") break
                  }
                  var end = arr.length - 1;
                  for (; end >= 0; end--) {
                      if (arr[end] !== "") break
                  }
                  if (start > end) return [];
                  return arr.slice(start, end - start + 1)
              }
              var fromParts = trim(from.split("/"));
              var toParts = trim(to.split("/"));
              var length = Math.min(fromParts.length, toParts.length);
              var samePartsLength = length;
              for (var i = 0; i < length; i++) {
                  if (fromParts[i] !== toParts[i]) {
                      samePartsLength = i;
                      break
                  }
              }
              var outputParts = [];
              for (var i = samePartsLength; i < fromParts.length; i++) {
                  outputParts.push("..")
              }
              outputParts = outputParts.concat(toParts.slice(samePartsLength));
              return outputParts.join("/")
          }
      };
      var TTY = {
          ttys: [],
          init: function() {},
          shutdown: function() {},
          register: function(dev, ops) {
              TTY.ttys[dev] = {
                  input: [],
                  output: [],
                  ops: ops
              };
              FS.registerDevice(dev, TTY.stream_ops)
          },
          stream_ops: {
              open: function(stream) {
                  var tty = TTY.ttys[stream.node.rdev];
                  if (!tty) {
                      throw new FS.ErrnoError(43)
                  }
                  stream.tty = tty;
                  stream.seekable = false
              },
              close: function(stream) {
                  stream.tty.ops.flush(stream.tty)
              },
              flush: function(stream) {
                  stream.tty.ops.flush(stream.tty)
              },
              read: function(stream, buffer, offset, length, pos) {
                  if (!stream.tty || !stream.tty.ops.get_char) {
                      throw new FS.ErrnoError(60)
                  }
                  var bytesRead = 0;
                  for (var i = 0; i < length; i++) {
                      var result;
                      try {
                          result = stream.tty.ops.get_char(stream.tty)
                      } catch (e) {
                          throw new FS.ErrnoError(29)
                      }
                      if (result === undefined && bytesRead === 0) {
                          throw new FS.ErrnoError(6)
                      }
                      if (result === null || result === undefined) break;
                      bytesRead++;
                      buffer[offset + i] = result
                  }
                  if (bytesRead) {
                      stream.node.timestamp = Date.now()
                  }
                  return bytesRead
              },
              write: function(stream, buffer, offset, length, pos) {
                  if (!stream.tty || !stream.tty.ops.put_char) {
                      throw new FS.ErrnoError(60)
                  }
                  try {
                      for (var i = 0; i < length; i++) {
                          stream.tty.ops.put_char(stream.tty, buffer[offset + i])
                      }
                  } catch (e) {
                      throw new FS.ErrnoError(29)
                  }
                  if (length) {
                      stream.node.timestamp = Date.now()
                  }
                  return i
              }
          },
          default_tty_ops: {
              get_char: function(tty) {
                  if (!tty.input.length) {
                      var result = null;
                      if (ENVIRONMENT_IS_NODE) {
                          var BUFSIZE = 256;
                          var buf = Buffer.alloc(BUFSIZE);
                          var bytesRead = 0;
                          try {
                              bytesRead = fs.readSync(process.stdin.fd, buf, 0, BUFSIZE, -1)
                          } catch (e) {
                              if (e.toString().includes("EOF")) bytesRead = 0;
                              else throw e
                          }
                          if (bytesRead > 0) {
                              result = buf.slice(0, bytesRead).toString("utf-8")
                          } else {
                              result = null
                          }
                      } else if (typeof window != "undefined" && typeof window.prompt == "function") {
                          result = window.prompt("Input: ");
                          if (result !== null) {
                              result += "\n"
                          }
                      } else if (typeof readline == "function") {
                          result = readline();
                          if (result !== null) {
                              result += "\n"
                          }
                      }
                      if (!result) {
                          return null
                      }
                      tty.input = intArrayFromString(result, true)
                  }
                  return tty.input.shift()
              },
              put_char: function(tty, val) {
                  if (val === null || val === 10) {
                      out(UTF8ArrayToString(tty.output, 0));
                      tty.output = []
                  } else {
                      if (val != 0) tty.output.push(val)
                  }
              },
              flush: function(tty) {
                  if (tty.output && tty.output.length > 0) {
                      out(UTF8ArrayToString(tty.output, 0));
                      tty.output = []
                  }
              }
          },
          default_tty1_ops: {
              put_char: function(tty, val) {
                  if (val === null || val === 10) {
                      err(UTF8ArrayToString(tty.output, 0));
                      tty.output = []
                  } else {
                      if (val != 0) tty.output.push(val)
                  }
              },
              flush: function(tty) {
                  if (tty.output && tty.output.length > 0) {
                      err(UTF8ArrayToString(tty.output, 0));
                      tty.output = []
                  }
              }
          }
      };

      function zeroMemory(address, size) {
          HEAPU8.fill(0, address, address + size)
      }

      function alignMemory(size, alignment) {
          return Math.ceil(size / alignment) * alignment
      }

      function mmapAlloc(size) {
          size = alignMemory(size, 65536);
          var ptr = _emscripten_builtin_memalign(65536, size);
          if (!ptr) return 0;
          zeroMemory(ptr, size);
          return ptr
      }
      var MEMFS = {
          ops_table: null,
          mount: function(mount) {
              return MEMFS.createNode(null, "/", 16384 | 511, 0)
          },
          createNode: function(parent, name, mode, dev) {
              if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
                  throw new FS.ErrnoError(63)
              }
              if (!MEMFS.ops_table) {
                  MEMFS.ops_table = {
                      dir: {
                          node: {
                              getattr: MEMFS.node_ops.getattr,
                              setattr: MEMFS.node_ops.setattr,
                              lookup: MEMFS.node_ops.lookup,
                              mknod: MEMFS.node_ops.mknod,
                              rename: MEMFS.node_ops.rename,
                              unlink: MEMFS.node_ops.unlink,
                              rmdir: MEMFS.node_ops.rmdir,
                              readdir: MEMFS.node_ops.readdir,
                              symlink: MEMFS.node_ops.symlink
                          },
                          stream: {
                              llseek: MEMFS.stream_ops.llseek
                          }
                      },
                      file: {
                          node: {
                              getattr: MEMFS.node_ops.getattr,
                              setattr: MEMFS.node_ops.setattr
                          },
                          stream: {
                              llseek: MEMFS.stream_ops.llseek,
                              read: MEMFS.stream_ops.read,
                              write: MEMFS.stream_ops.write,
                              allocate: MEMFS.stream_ops.allocate,
                              mmap: MEMFS.stream_ops.mmap,
                              msync: MEMFS.stream_ops.msync
                          }
                      },
                      link: {
                          node: {
                              getattr: MEMFS.node_ops.getattr,
                              setattr: MEMFS.node_ops.setattr,
                              readlink: MEMFS.node_ops.readlink
                          },
                          stream: {}
                      },
                      chrdev: {
                          node: {
                              getattr: MEMFS.node_ops.getattr,
                              setattr: MEMFS.node_ops.setattr
                          },
                          stream: FS.chrdev_stream_ops
                      }
                  }
              }
              var node = FS.createNode(parent, name, mode, dev);
              if (FS.isDir(node.mode)) {
                  node.node_ops = MEMFS.ops_table.dir.node;
                  node.stream_ops = MEMFS.ops_table.dir.stream;
                  node.contents = {}
              } else if (FS.isFile(node.mode)) {
                  node.node_ops = MEMFS.ops_table.file.node;
                  node.stream_ops = MEMFS.ops_table.file.stream;
                  node.usedBytes = 0;
                  node.contents = null
              } else if (FS.isLink(node.mode)) {
                  node.node_ops = MEMFS.ops_table.link.node;
                  node.stream_ops = MEMFS.ops_table.link.stream
              } else if (FS.isChrdev(node.mode)) {
                  node.node_ops = MEMFS.ops_table.chrdev.node;
                  node.stream_ops = MEMFS.ops_table.chrdev.stream
              }
              node.timestamp = Date.now();
              if (parent) {
                  parent.contents[name] = node;
                  parent.timestamp = node.timestamp
              }
              return node
          },
          getFileDataAsTypedArray: function(node) {
              if (!node.contents) return new Uint8Array(0);
              if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes);
              return new Uint8Array(node.contents)
          },
          expandFileStorage: function(node, newCapacity) {
              var prevCapacity = node.contents ? node.contents.length : 0;
              if (prevCapacity >= newCapacity) return;
              var CAPACITY_DOUBLING_MAX = 1024 * 1024;
              newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) >>> 0);
              if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256);
              var oldContents = node.contents;
              node.contents = new Uint8Array(newCapacity);
              if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0)
          },
          resizeFileStorage: function(node, newSize) {
              if (node.usedBytes == newSize) return;
              if (newSize == 0) {
                  node.contents = null;
                  node.usedBytes = 0
              } else {
                  var oldContents = node.contents;
                  node.contents = new Uint8Array(newSize);
                  if (oldContents) {
                      node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)))
                  }
                  node.usedBytes = newSize
              }
          },
          node_ops: {
              getattr: function(node) {
                  var attr = {};
                  attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
                  attr.ino = node.id;
                  attr.mode = node.mode;
                  attr.nlink = 1;
                  attr.uid = 0;
                  attr.gid = 0;
                  attr.rdev = node.rdev;
                  if (FS.isDir(node.mode)) {
                      attr.size = 4096
                  } else if (FS.isFile(node.mode)) {
                      attr.size = node.usedBytes
                  } else if (FS.isLink(node.mode)) {
                      attr.size = node.link.length
                  } else {
                      attr.size = 0
                  }
                  attr.atime = new Date(node.timestamp);
                  attr.mtime = new Date(node.timestamp);
                  attr.ctime = new Date(node.timestamp);
                  attr.blksize = 4096;
                  attr.blocks = Math.ceil(attr.size / attr.blksize);
                  return attr
              },
              setattr: function(node, attr) {
                  if (attr.mode !== undefined) {
                      node.mode = attr.mode
                  }
                  if (attr.timestamp !== undefined) {
                      node.timestamp = attr.timestamp
                  }
                  if (attr.size !== undefined) {
                      MEMFS.resizeFileStorage(node, attr.size)
                  }
              },
              lookup: function(parent, name) {
                  throw FS.genericErrors[44]
              },
              mknod: function(parent, name, mode, dev) {
                  return MEMFS.createNode(parent, name, mode, dev)
              },
              rename: function(old_node, new_dir, new_name) {
                  if (FS.isDir(old_node.mode)) {
                      var new_node;
                      try {
                          new_node = FS.lookupNode(new_dir, new_name)
                      } catch (e) {}
                      if (new_node) {
                          for (var i in new_node.contents) {
                              throw new FS.ErrnoError(55)
                          }
                      }
                  }
                  delete old_node.parent.contents[old_node.name];
                  old_node.parent.timestamp = Date.now();
                  old_node.name = new_name;
                  new_dir.contents[new_name] = old_node;
                  new_dir.timestamp = old_node.parent.timestamp;
                  old_node.parent = new_dir
              },
              unlink: function(parent, name) {
                  delete parent.contents[name];
                  parent.timestamp = Date.now()
              },
              rmdir: function(parent, name) {
                  var node = FS.lookupNode(parent, name);
                  for (var i in node.contents) {
                      throw new FS.ErrnoError(55)
                  }
                  delete parent.contents[name];
                  parent.timestamp = Date.now()
              },
              readdir: function(node) {
                  var entries = [".", ".."];
                  for (var key in node.contents) {
                      if (!node.contents.hasOwnProperty(key)) {
                          continue
                      }
                      entries.push(key)
                  }
                  return entries
              },
              symlink: function(parent, newname, oldpath) {
                  var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
                  node.link = oldpath;
                  return node
              },
              readlink: function(node) {
                  if (!FS.isLink(node.mode)) {
                      throw new FS.ErrnoError(28)
                  }
                  return node.link
              }
          },
          stream_ops: {
              read: function(stream, buffer, offset, length, position) {
                  var contents = stream.node.contents;
                  if (position >= stream.node.usedBytes) return 0;
                  var size = Math.min(stream.node.usedBytes - position, length);
                  if (size > 8 && contents.subarray) {
                      buffer.set(contents.subarray(position, position + size), offset)
                  } else {
                      for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i]
                  }
                  return size
              },
              write: function(stream, buffer, offset, length, position, canOwn) {
                  if (buffer.buffer === HEAP8.buffer) {
                      canOwn = false
                  }
                  if (!length) return 0;
                  var node = stream.node;
                  node.timestamp = Date.now();
                  if (buffer.subarray && (!node.contents || node.contents.subarray)) {
                      if (canOwn) {
                          node.contents = buffer.subarray(offset, offset + length);
                          node.usedBytes = length;
                          return length
                      } else if (node.usedBytes === 0 && position === 0) {
                          node.contents = buffer.slice(offset, offset + length);
                          node.usedBytes = length;
                          return length
                      } else if (position + length <= node.usedBytes) {
                          node.contents.set(buffer.subarray(offset, offset + length), position);
                          return length
                      }
                  }
                  MEMFS.expandFileStorage(node, position + length);
                  if (node.contents.subarray && buffer.subarray) {
                      node.contents.set(buffer.subarray(offset, offset + length), position)
                  } else {
                      for (var i = 0; i < length; i++) {
                          node.contents[position + i] = buffer[offset + i]
                      }
                  }
                  node.usedBytes = Math.max(node.usedBytes, position + length);
                  return length
              },
              llseek: function(stream, offset, whence) {
                  var position = offset;
                  if (whence === 1) {
                      position += stream.position
                  } else if (whence === 2) {
                      if (FS.isFile(stream.node.mode)) {
                          position += stream.node.usedBytes
                      }
                  }
                  if (position < 0) {
                      throw new FS.ErrnoError(28)
                  }
                  return position
              },
              allocate: function(stream, offset, length) {
                  MEMFS.expandFileStorage(stream.node, offset + length);
                  stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length)
              },
              mmap: function(stream, address, length, position, prot, flags) {
                  if (address !== 0) {
                      throw new FS.ErrnoError(28)
                  }
                  if (!FS.isFile(stream.node.mode)) {
                      throw new FS.ErrnoError(43)
                  }
                  var ptr;
                  var allocated;
                  var contents = stream.node.contents;
                  if (!(flags & 2) && contents.buffer === buffer) {
                      allocated = false;
                      ptr = contents.byteOffset
                  } else {
                      if (position > 0 || position + length < contents.length) {
                          if (contents.subarray) {
                              contents = contents.subarray(position, position + length)
                          } else {
                              contents = Array.prototype.slice.call(contents, position, position + length)
                          }
                      }
                      allocated = true;
                      ptr = mmapAlloc(length);
                      if (!ptr) {
                          throw new FS.ErrnoError(48)
                      }
                      HEAP8.set(contents, ptr)
                  }
                  return {
                      ptr: ptr,
                      allocated: allocated
                  }
              },
              msync: function(stream, buffer, offset, length, mmapFlags) {
                  if (!FS.isFile(stream.node.mode)) {
                      throw new FS.ErrnoError(43)
                  }
                  if (mmapFlags & 2) {
                      return 0
                  }
                  var bytesWritten = MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
                  return 0
              }
          }
      };

      function asyncLoad(url, onload, onerror, noRunDep) {
          var dep = !noRunDep ? getUniqueRunDependency("al " + url) : "";
          readAsync(url, function(arrayBuffer) {
              assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
              onload(new Uint8Array(arrayBuffer));
              if (dep) removeRunDependency(dep)
          }, function(event) {
              if (onerror) {
                  onerror()
              } else {
                  throw 'Loading data file "' + url + '" failed.'
              }
          });
          if (dep) addRunDependency(dep)
      }
      var FS = {
          root: null,
          mounts: [],
          devices: {},
          streams: [],
          nextInode: 1,
          nameTable: null,
          currentPath: "/",
          initialized: false,
          ignorePermissions: true,
          ErrnoError: null,
          genericErrors: {},
          filesystems: null,
          syncFSRequests: 0,
          lookupPath: (path, opts = {}) => {
              path = PATH_FS.resolve(FS.cwd(), path);
              if (!path) return {
                  path: "",
                  node: null
              };
              var defaults = {
                  follow_mount: true,
                  recurse_count: 0
              };
              opts = Object.assign(defaults, opts);
              if (opts.recurse_count > 8) {
                  throw new FS.ErrnoError(32)
              }
              var parts = PATH.normalizeArray(path.split("/").filter(p => !!p), false);
              var current = FS.root;
              var current_path = "/";
              for (var i = 0; i < parts.length; i++) {
                  var islast = i === parts.length - 1;
                  if (islast && opts.parent) {
                      break
                  }
                  current = FS.lookupNode(current, parts[i]);
                  current_path = PATH.join2(current_path, parts[i]);
                  if (FS.isMountpoint(current)) {
                      if (!islast || islast && opts.follow_mount) {
                          current = current.mounted.root
                      }
                  }
                  if (!islast || opts.follow) {
                      var count = 0;
                      while (FS.isLink(current.mode)) {
                          var link = FS.readlink(current_path);
                          current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
                          var lookup = FS.lookupPath(current_path, {
                              recurse_count: opts.recurse_count + 1
                          });
                          current = lookup.node;
                          if (count++ > 40) {
                              throw new FS.ErrnoError(32)
                          }
                      }
                  }
              }
              return {
                  path: current_path,
                  node: current
              }
          },
          getPath: node => {
              var path;
              while (true) {
                  if (FS.isRoot(node)) {
                      var mount = node.mount.mountpoint;
                      if (!path) return mount;
                      return mount[mount.length - 1] !== "/" ? mount + "/" + path : mount + path
                  }
                  path = path ? node.name + "/" + path : node.name;
                  node = node.parent
              }
          },
          hashName: (parentid, name) => {
              var hash = 0;
              for (var i = 0; i < name.length; i++) {
                  hash = (hash << 5) - hash + name.charCodeAt(i) | 0
              }
              return (parentid + hash >>> 0) % FS.nameTable.length
          },
          hashAddNode: node => {
              var hash = FS.hashName(node.parent.id, node.name);
              node.name_next = FS.nameTable[hash];
              FS.nameTable[hash] = node
          },
          hashRemoveNode: node => {
              var hash = FS.hashName(node.parent.id, node.name);
              if (FS.nameTable[hash] === node) {
                  FS.nameTable[hash] = node.name_next
              } else {
                  var current = FS.nameTable[hash];
                  while (current) {
                      if (current.name_next === node) {
                          current.name_next = node.name_next;
                          break
                      }
                      current = current.name_next
                  }
              }
          },
          lookupNode: (parent, name) => {
              var errCode = FS.mayLookup(parent);
              if (errCode) {
                  throw new FS.ErrnoError(errCode, parent)
              }
              var hash = FS.hashName(parent.id, name);
              for (var node = FS.nameTable[hash]; node; node = node.name_next) {
                  var nodeName = node.name;
                  if (node.parent.id === parent.id && nodeName === name) {
                      return node
                  }
              }
              return FS.lookup(parent, name)
          },
          createNode: (parent, name, mode, rdev) => {
              var node = new FS.FSNode(parent, name, mode, rdev);
              FS.hashAddNode(node);
              return node
          },
          destroyNode: node => {
              FS.hashRemoveNode(node)
          },
          isRoot: node => {
              return node === node.parent
          },
          isMountpoint: node => {
              return !!node.mounted
          },
          isFile: mode => {
              return (mode & 61440) === 32768
          },
          isDir: mode => {
              return (mode & 61440) === 16384
          },
          isLink: mode => {
              return (mode & 61440) === 40960
          },
          isChrdev: mode => {
              return (mode & 61440) === 8192
          },
          isBlkdev: mode => {
              return (mode & 61440) === 24576
          },
          isFIFO: mode => {
              return (mode & 61440) === 4096
          },
          isSocket: mode => {
              return (mode & 49152) === 49152
          },
          flagModes: {
              "r": 0,
              "r+": 2,
              "w": 577,
              "w+": 578,
              "a": 1089,
              "a+": 1090
          },
          modeStringToFlags: str => {
              var flags = FS.flagModes[str];
              if (typeof flags == "undefined") {
                  throw new Error("Unknown file open mode: " + str)
              }
              return flags
          },
          flagsToPermissionString: flag => {
              var perms = ["r", "w", "rw"][flag & 3];
              if (flag & 512) {
                  perms += "w"
              }
              return perms
          },
          nodePermissions: (node, perms) => {
              if (FS.ignorePermissions) {
                  return 0
              }
              if (perms.includes("r") && !(node.mode & 292)) {
                  return 2
              } else if (perms.includes("w") && !(node.mode & 146)) {
                  return 2
              } else if (perms.includes("x") && !(node.mode & 73)) {
                  return 2
              }
              return 0
          },
          mayLookup: dir => {
              var errCode = FS.nodePermissions(dir, "x");
              if (errCode) return errCode;
              if (!dir.node_ops.lookup) return 2;
              return 0
          },
          mayCreate: (dir, name) => {
              try {
                  var node = FS.lookupNode(dir, name);
                  return 20
              } catch (e) {}
              return FS.nodePermissions(dir, "wx")
          },
          mayDelete: (dir, name, isdir) => {
              var node;
              try {
                  node = FS.lookupNode(dir, name)
              } catch (e) {
                  return e.errno
              }
              var errCode = FS.nodePermissions(dir, "wx");
              if (errCode) {
                  return errCode
              }
              if (isdir) {
                  if (!FS.isDir(node.mode)) {
                      return 54
                  }
                  if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
                      return 10
                  }
              } else {
                  if (FS.isDir(node.mode)) {
                      return 31
                  }
              }
              return 0
          },
          mayOpen: (node, flags) => {
              if (!node) {
                  return 44
              }
              if (FS.isLink(node.mode)) {
                  return 32
              } else if (FS.isDir(node.mode)) {
                  if (FS.flagsToPermissionString(flags) !== "r" || flags & 512) {
                      return 31
                  }
              }
              return FS.nodePermissions(node, FS.flagsToPermissionString(flags))
          },
          MAX_OPEN_FDS: 4096,
          nextfd: (fd_start = 0, fd_end = FS.MAX_OPEN_FDS) => {
              for (var fd = fd_start; fd <= fd_end; fd++) {
                  if (!FS.streams[fd]) {
                      return fd
                  }
              }
              throw new FS.ErrnoError(33)
          },
          getStream: fd => FS.streams[fd],
          createStream: (stream, fd_start, fd_end) => {
              if (!FS.FSStream) {
                  FS.FSStream = function() {
                      this.shared = {}
                  };
                  FS.FSStream.prototype = {
                      object: {
                          get: function() {
                              return this.node
                          },
                          set: function(val) {
                              this.node = val
                          }
                      },
                      isRead: {
                          get: function() {
                              return (this.flags & 2097155) !== 1
                          }
                      },
                      isWrite: {
                          get: function() {
                              return (this.flags & 2097155) !== 0
                          }
                      },
                      isAppend: {
                          get: function() {
                              return this.flags & 1024
                          }
                      },
                      flags: {
                          get: function() {
                              return this.shared.flags
                          },
                          set: function(val) {
                              this.shared.flags = val
                          }
                      },
                      position: {
                          get function() {
                              return this.shared.position
                          },
                          set: function(val) {
                              this.shared.position = val
                          }
                      }
                  }
              }
              stream = Object.assign(new FS.FSStream, stream);
              var fd = FS.nextfd(fd_start, fd_end);
              stream.fd = fd;
              FS.streams[fd] = stream;
              return stream
          },
          closeStream: fd => {
              FS.streams[fd] = null
          },
          chrdev_stream_ops: {
              open: stream => {
                  var device = FS.getDevice(stream.node.rdev);
                  stream.stream_ops = device.stream_ops;
                  if (stream.stream_ops.open) {
                      stream.stream_ops.open(stream)
                  }
              },
              llseek: () => {
                  throw new FS.ErrnoError(70)
              }
          },
          major: dev => dev >> 8,
          minor: dev => dev & 255,
          makedev: (ma, mi) => ma << 8 | mi,
          registerDevice: (dev, ops) => {
              FS.devices[dev] = {
                  stream_ops: ops
              }
          },
          getDevice: dev => FS.devices[dev],
          getMounts: mount => {
              var mounts = [];
              var check = [mount];
              while (check.length) {
                  var m = check.pop();
                  mounts.push(m);
                  check.push.apply(check, m.mounts)
              }
              return mounts
          },
          syncfs: (populate, callback) => {
              if (typeof populate == "function") {
                  callback = populate;
                  populate = false
              }
              FS.syncFSRequests++;
              if (FS.syncFSRequests > 1) {
                  err("warning: " + FS.syncFSRequests + " FS.syncfs operations in flight at once, probably just doing extra work")
              }
              var mounts = FS.getMounts(FS.root.mount);
              var completed = 0;

              function doCallback(errCode) {
                  FS.syncFSRequests--;
                  return callback(errCode)
              }

              function done(errCode) {
                  if (errCode) {
                      if (!done.errored) {
                          done.errored = true;
                          return doCallback(errCode)
                      }
                      return
                  }
                  if (++completed >= mounts.length) {
                      doCallback(null)
                  }
              }
              mounts.forEach(mount => {
                  if (!mount.type.syncfs) {
                      return done(null)
                  }
                  mount.type.syncfs(mount, populate, done)
              })
          },
          mount: (type, opts, mountpoint) => {
              var root = mountpoint === "/";
              var pseudo = !mountpoint;
              var node;
              if (root && FS.root) {
                  throw new FS.ErrnoError(10)
              } else if (!root && !pseudo) {
                  var lookup = FS.lookupPath(mountpoint, {
                      follow_mount: false
                  });
                  mountpoint = lookup.path;
                  node = lookup.node;
                  if (FS.isMountpoint(node)) {
                      throw new FS.ErrnoError(10)
                  }
                  if (!FS.isDir(node.mode)) {
                      throw new FS.ErrnoError(54)
                  }
              }
              var mount = {
                  type: type,
                  opts: opts,
                  mountpoint: mountpoint,
                  mounts: []
              };
              var mountRoot = type.mount(mount);
              mountRoot.mount = mount;
              mount.root = mountRoot;
              if (root) {
                  FS.root = mountRoot
              } else if (node) {
                  node.mounted = mount;
                  if (node.mount) {
                      node.mount.mounts.push(mount)
                  }
              }
              return mountRoot
          },
          unmount: mountpoint => {
              var lookup = FS.lookupPath(mountpoint, {
                  follow_mount: false
              });
              if (!FS.isMountpoint(lookup.node)) {
                  throw new FS.ErrnoError(28)
              }
              var node = lookup.node;
              var mount = node.mounted;
              var mounts = FS.getMounts(mount);
              Object.keys(FS.nameTable).forEach(hash => {
                  var current = FS.nameTable[hash];
                  while (current) {
                      var next = current.name_next;
                      if (mounts.includes(current.mount)) {
                          FS.destroyNode(current)
                      }
                      current = next
                  }
              });
              node.mounted = null;
              var idx = node.mount.mounts.indexOf(mount);
              node.mount.mounts.splice(idx, 1)
          },
          lookup: (parent, name) => {
              return parent.node_ops.lookup(parent, name)
          },
          mknod: (path, mode, dev) => {
              var lookup = FS.lookupPath(path, {
                  parent: true
              });
              var parent = lookup.node;
              var name = PATH.basename(path);
              if (!name || name === "." || name === "..") {
                  throw new FS.ErrnoError(28)
              }
              var errCode = FS.mayCreate(parent, name);
              if (errCode) {
                  throw new FS.ErrnoError(errCode)
              }
              if (!parent.node_ops.mknod) {
                  throw new FS.ErrnoError(63)
              }
              return parent.node_ops.mknod(parent, name, mode, dev)
          },
          create: (path, mode) => {
              mode = mode !== undefined ? mode : 438;
              mode &= 4095;
              mode |= 32768;
              return FS.mknod(path, mode, 0)
          },
          mkdir: (path, mode) => {
              mode = mode !== undefined ? mode : 511;
              mode &= 511 | 512;
              mode |= 16384;
              return FS.mknod(path, mode, 0)
          },
          mkdirTree: (path, mode) => {
              var dirs = path.split("/");
              var d = "";
              for (var i = 0; i < dirs.length; ++i) {
                  if (!dirs[i]) continue;
                  d += "/" + dirs[i];
                  try {
                      FS.mkdir(d, mode)
                  } catch (e) {
                      if (e.errno != 20) throw e
                  }
              }
          },
          mkdev: (path, mode, dev) => {
              if (typeof dev == "undefined") {
                  dev = mode;
                  mode = 438
              }
              mode |= 8192;
              return FS.mknod(path, mode, dev)
          },
          symlink: (oldpath, newpath) => {
              if (!PATH_FS.resolve(oldpath)) {
                  throw new FS.ErrnoError(44)
              }
              var lookup = FS.lookupPath(newpath, {
                  parent: true
              });
              var parent = lookup.node;
              if (!parent) {
                  throw new FS.ErrnoError(44)
              }
              var newname = PATH.basename(newpath);
              var errCode = FS.mayCreate(parent, newname);
              if (errCode) {
                  throw new FS.ErrnoError(errCode)
              }
              if (!parent.node_ops.symlink) {
                  throw new FS.ErrnoError(63)
              }
              return parent.node_ops.symlink(parent, newname, oldpath)
          },
          rename: (old_path, new_path) => {
              var old_dirname = PATH.dirname(old_path);
              var new_dirname = PATH.dirname(new_path);
              var old_name = PATH.basename(old_path);
              var new_name = PATH.basename(new_path);
              var lookup, old_dir, new_dir;
              lookup = FS.lookupPath(old_path, {
                  parent: true
              });
              old_dir = lookup.node;
              lookup = FS.lookupPath(new_path, {
                  parent: true
              });
              new_dir = lookup.node;
              if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
              if (old_dir.mount !== new_dir.mount) {
                  throw new FS.ErrnoError(75)
              }
              var old_node = FS.lookupNode(old_dir, old_name);
              var relative = PATH_FS.relative(old_path, new_dirname);
              if (relative.charAt(0) !== ".") {
                  throw new FS.ErrnoError(28)
              }
              relative = PATH_FS.relative(new_path, old_dirname);
              if (relative.charAt(0) !== ".") {
                  throw new FS.ErrnoError(55)
              }
              var new_node;
              try {
                  new_node = FS.lookupNode(new_dir, new_name)
              } catch (e) {}
              if (old_node === new_node) {
                  return
              }
              var isdir = FS.isDir(old_node.mode);
              var errCode = FS.mayDelete(old_dir, old_name, isdir);
              if (errCode) {
                  throw new FS.ErrnoError(errCode)
              }
              errCode = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
              if (errCode) {
                  throw new FS.ErrnoError(errCode)
              }
              if (!old_dir.node_ops.rename) {
                  throw new FS.ErrnoError(63)
              }
              if (FS.isMountpoint(old_node) || new_node && FS.isMountpoint(new_node)) {
                  throw new FS.ErrnoError(10)
              }
              if (new_dir !== old_dir) {
                  errCode = FS.nodePermissions(old_dir, "w");
                  if (errCode) {
                      throw new FS.ErrnoError(errCode)
                  }
              }
              FS.hashRemoveNode(old_node);
              try {
                  old_dir.node_ops.rename(old_node, new_dir, new_name)
              } catch (e) {
                  throw e
              } finally {
                  FS.hashAddNode(old_node)
              }
          },
          rmdir: path => {
              var lookup = FS.lookupPath(path, {
                  parent: true
              });
              var parent = lookup.node;
              var name = PATH.basename(path);
              var node = FS.lookupNode(parent, name);
              var errCode = FS.mayDelete(parent, name, true);
              if (errCode) {
                  throw new FS.ErrnoError(errCode)
              }
              if (!parent.node_ops.rmdir) {
                  throw new FS.ErrnoError(63)
              }
              if (FS.isMountpoint(node)) {
                  throw new FS.ErrnoError(10)
              }
              parent.node_ops.rmdir(parent, name);
              FS.destroyNode(node)
          },
          readdir: path => {
              var lookup = FS.lookupPath(path, {
                  follow: true
              });
              var node = lookup.node;
              if (!node.node_ops.readdir) {
                  throw new FS.ErrnoError(54)
              }
              return node.node_ops.readdir(node)
          },
          unlink: path => {
              var lookup = FS.lookupPath(path, {
                  parent: true
              });
              var parent = lookup.node;
              if (!parent) {
                  throw new FS.ErrnoError(44)
              }
              var name = PATH.basename(path);
              var node = FS.lookupNode(parent, name);
              var errCode = FS.mayDelete(parent, name, false);
              if (errCode) {
                  throw new FS.ErrnoError(errCode)
              }
              if (!parent.node_ops.unlink) {
                  throw new FS.ErrnoError(63)
              }
              if (FS.isMountpoint(node)) {
                  throw new FS.ErrnoError(10)
              }
              parent.node_ops.unlink(parent, name);
              FS.destroyNode(node)
          },
          readlink: path => {
              var lookup = FS.lookupPath(path);
              var link = lookup.node;
              if (!link) {
                  throw new FS.ErrnoError(44)
              }
              if (!link.node_ops.readlink) {
                  throw new FS.ErrnoError(28)
              }
              return PATH_FS.resolve(FS.getPath(link.parent), link.node_ops.readlink(link))
          },
          stat: (path, dontFollow) => {
              var lookup = FS.lookupPath(path, {
                  follow: !dontFollow
              });
              var node = lookup.node;
              if (!node) {
                  throw new FS.ErrnoError(44)
              }
              if (!node.node_ops.getattr) {
                  throw new FS.ErrnoError(63)
              }
              return node.node_ops.getattr(node)
          },
          lstat: path => {
              return FS.stat(path, true)
          },
          chmod: (path, mode, dontFollow) => {
              var node;
              if (typeof path == "string") {
                  var lookup = FS.lookupPath(path, {
                      follow: !dontFollow
                  });
                  node = lookup.node
              } else {
                  node = path
              }
              if (!node.node_ops.setattr) {
                  throw new FS.ErrnoError(63)
              }
              node.node_ops.setattr(node, {
                  mode: mode & 4095 | node.mode & ~4095,
                  timestamp: Date.now()
              })
          },
          lchmod: (path, mode) => {
              FS.chmod(path, mode, true)
          },
          fchmod: (fd, mode) => {
              var stream = FS.getStream(fd);
              if (!stream) {
                  throw new FS.ErrnoError(8)
              }
              FS.chmod(stream.node, mode)
          },
          chown: (path, uid, gid, dontFollow) => {
              var node;
              if (typeof path == "string") {
                  var lookup = FS.lookupPath(path, {
                      follow: !dontFollow
                  });
                  node = lookup.node
              } else {
                  node = path
              }
              if (!node.node_ops.setattr) {
                  throw new FS.ErrnoError(63)
              }
              node.node_ops.setattr(node, {
                  timestamp: Date.now()
              })
          },
          lchown: (path, uid, gid) => {
              FS.chown(path, uid, gid, true)
          },
          fchown: (fd, uid, gid) => {
              var stream = FS.getStream(fd);
              if (!stream) {
                  throw new FS.ErrnoError(8)
              }
              FS.chown(stream.node, uid, gid)
          },
          truncate: (path, len) => {
              if (len < 0) {
                  throw new FS.ErrnoError(28)
              }
              var node;
              if (typeof path == "string") {
                  var lookup = FS.lookupPath(path, {
                      follow: true
                  });
                  node = lookup.node
              } else {
                  node = path
              }
              if (!node.node_ops.setattr) {
                  throw new FS.ErrnoError(63)
              }
              if (FS.isDir(node.mode)) {
                  throw new FS.ErrnoError(31)
              }
              if (!FS.isFile(node.mode)) {
                  throw new FS.ErrnoError(28)
              }
              var errCode = FS.nodePermissions(node, "w");
              if (errCode) {
                  throw new FS.ErrnoError(errCode)
              }
              node.node_ops.setattr(node, {
                  size: len,
                  timestamp: Date.now()
              })
          },
          ftruncate: (fd, len) => {
              var stream = FS.getStream(fd);
              if (!stream) {
                  throw new FS.ErrnoError(8)
              }
              if ((stream.flags & 2097155) === 0) {
                  throw new FS.ErrnoError(28)
              }
              FS.truncate(stream.node, len)
          },
          utime: (path, atime, mtime) => {
              var lookup = FS.lookupPath(path, {
                  follow: true
              });
              var node = lookup.node;
              node.node_ops.setattr(node, {
                  timestamp: Math.max(atime, mtime)
              })
          },
          open: (path, flags, mode) => {
              if (path === "") {
                  throw new FS.ErrnoError(44)
              }
              flags = typeof flags == "string" ? FS.modeStringToFlags(flags) : flags;
              mode = typeof mode == "undefined" ? 438 : mode;
              if (flags & 64) {
                  mode = mode & 4095 | 32768
              } else {
                  mode = 0
              }
              var node;
              if (typeof path == "object") {
                  node = path
              } else {
                  path = PATH.normalize(path);
                  try {
                      var lookup = FS.lookupPath(path, {
                          follow: !(flags & 131072)
                      });
                      node = lookup.node
                  } catch (e) {}
              }
              var created = false;
              if (flags & 64) {
                  if (node) {
                      if (flags & 128) {
                          throw new FS.ErrnoError(20)
                      }
                  } else {
                      node = FS.mknod(path, mode, 0);
                      created = true
                  }
              }
              if (!node) {
                  throw new FS.ErrnoError(44)
              }
              if (FS.isChrdev(node.mode)) {
                  flags &= ~512
              }
              if (flags & 65536 && !FS.isDir(node.mode)) {
                  throw new FS.ErrnoError(54)
              }
              if (!created) {
                  var errCode = FS.mayOpen(node, flags);
                  if (errCode) {
                      throw new FS.ErrnoError(errCode)
                  }
              }
              if (flags & 512 && !created) {
                  FS.truncate(node, 0)
              }
              flags &= ~(128 | 512 | 131072);
              var stream = FS.createStream({
                  node: node,
                  path: FS.getPath(node),
                  flags: flags,
                  seekable: true,
                  position: 0,
                  stream_ops: node.stream_ops,
                  ungotten: [],
                  error: false
              });
              if (stream.stream_ops.open) {
                  stream.stream_ops.open(stream)
              }
              if (Module["logReadFiles"] && !(flags & 1)) {
                  if (!FS.readFiles) FS.readFiles = {};
                  if (!(path in FS.readFiles)) {
                      FS.readFiles[path] = 1
                  }
              }
              return stream
          },
          close: stream => {
              if (FS.isClosed(stream)) {
                  throw new FS.ErrnoError(8)
              }
              if (stream.getdents) stream.getdents = null;
              try {
                  if (stream.stream_ops.close) {
                      stream.stream_ops.close(stream)
                  }
              } catch (e) {
                  throw e
              } finally {
                  FS.closeStream(stream.fd)
              }
              stream.fd = null
          },
          isClosed: stream => {
              return stream.fd === null
          },
          llseek: (stream, offset, whence) => {
              if (FS.isClosed(stream)) {
                  throw new FS.ErrnoError(8)
              }
              if (!stream.seekable || !stream.stream_ops.llseek) {
                  throw new FS.ErrnoError(70)
              }
              if (whence != 0 && whence != 1 && whence != 2) {
                  throw new FS.ErrnoError(28)
              }
              stream.position = stream.stream_ops.llseek(stream, offset, whence);
              stream.ungotten = [];
              return stream.position
          },
          read: (stream, buffer, offset, length, position) => {
              if (length < 0 || position < 0) {
                  throw new FS.ErrnoError(28)
              }
              if (FS.isClosed(stream)) {
                  throw new FS.ErrnoError(8)
              }
              if ((stream.flags & 2097155) === 1) {
                  throw new FS.ErrnoError(8)
              }
              if (FS.isDir(stream.node.mode)) {
                  throw new FS.ErrnoError(31)
              }
              if (!stream.stream_ops.read) {
                  throw new FS.ErrnoError(28)
              }
              var seeking = typeof position != "undefined";
              if (!seeking) {
                  position = stream.position
              } else if (!stream.seekable) {
                  throw new FS.ErrnoError(70)
              }
              var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
              if (!seeking) stream.position += bytesRead;
              return bytesRead
          },
          write: (stream, buffer, offset, length, position, canOwn) => {
              if (length < 0 || position < 0) {
                  throw new FS.ErrnoError(28)
              }
              if (FS.isClosed(stream)) {
                  throw new FS.ErrnoError(8)
              }
              if ((stream.flags & 2097155) === 0) {
                  throw new FS.ErrnoError(8)
              }
              if (FS.isDir(stream.node.mode)) {
                  throw new FS.ErrnoError(31)
              }
              if (!stream.stream_ops.write) {
                  throw new FS.ErrnoError(28)
              }
              if (stream.seekable && stream.flags & 1024) {
                  FS.llseek(stream, 0, 2)
              }
              var seeking = typeof position != "undefined";
              if (!seeking) {
                  position = stream.position
              } else if (!stream.seekable) {
                  throw new FS.ErrnoError(70)
              }
              var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
              if (!seeking) stream.position += bytesWritten;
              return bytesWritten
          },
          allocate: (stream, offset, length) => {
              if (FS.isClosed(stream)) {
                  throw new FS.ErrnoError(8)
              }
              if (offset < 0 || length <= 0) {
                  throw new FS.ErrnoError(28)
              }
              if ((stream.flags & 2097155) === 0) {
                  throw new FS.ErrnoError(8)
              }
              if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
                  throw new FS.ErrnoError(43)
              }
              if (!stream.stream_ops.allocate) {
                  throw new FS.ErrnoError(138)
              }
              stream.stream_ops.allocate(stream, offset, length)
          },
          mmap: (stream, address, length, position, prot, flags) => {
              if ((prot & 2) !== 0 && (flags & 2) === 0 && (stream.flags & 2097155) !== 2) {
                  throw new FS.ErrnoError(2)
              }
              if ((stream.flags & 2097155) === 1) {
                  throw new FS.ErrnoError(2)
              }
              if (!stream.stream_ops.mmap) {
                  throw new FS.ErrnoError(43)
              }
              return stream.stream_ops.mmap(stream, address, length, position, prot, flags)
          },
          msync: (stream, buffer, offset, length, mmapFlags) => {
              if (!stream || !stream.stream_ops.msync) {
                  return 0
              }
              return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags)
          },
          munmap: stream => 0,
          ioctl: (stream, cmd, arg) => {
              if (!stream.stream_ops.ioctl) {
                  throw new FS.ErrnoError(59)
              }
              return stream.stream_ops.ioctl(stream, cmd, arg)
          },
          readFile: (path, opts = {}) => {
              opts.flags = opts.flags || 0;
              opts.encoding = opts.encoding || "binary";
              if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
                  throw new Error('Invalid encoding type "' + opts.encoding + '"')
              }
              var ret;
              var stream = FS.open(path, opts.flags);
              var stat = FS.stat(path);
              var length = stat.size;
              var buf = new Uint8Array(length);
              FS.read(stream, buf, 0, length, 0);
              if (opts.encoding === "utf8") {
                  ret = UTF8ArrayToString(buf, 0)
              } else if (opts.encoding === "binary") {
                  ret = buf
              }
              FS.close(stream);
              return ret
          },
          writeFile: (path, data, opts = {}) => {
              opts.flags = opts.flags || 577;
              var stream = FS.open(path, opts.flags, opts.mode);
              if (typeof data == "string") {
                  var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
                  var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
                  FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn)
              } else if (ArrayBuffer.isView(data)) {
                  FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn)
              } else {
                  throw new Error("Unsupported data type")
              }
              FS.close(stream)
          },
          cwd: () => FS.currentPath,
          chdir: path => {
              var lookup = FS.lookupPath(path, {
                  follow: true
              });
              if (lookup.node === null) {
                  throw new FS.ErrnoError(44)
              }
              if (!FS.isDir(lookup.node.mode)) {
                  throw new FS.ErrnoError(54)
              }
              var errCode = FS.nodePermissions(lookup.node, "x");
              if (errCode) {
                  throw new FS.ErrnoError(errCode)
              }
              FS.currentPath = lookup.path
          },
          createDefaultDirectories: () => {
              FS.mkdir("/tmp");
              FS.mkdir("/home");
              FS.mkdir("/home/web_user")
          },
          createDefaultDevices: () => {
              FS.mkdir("/dev");
              FS.registerDevice(FS.makedev(1, 3), {
                  read: () => 0,
                  write: (stream, buffer, offset, length, pos) => length
              });
              FS.mkdev("/dev/null", FS.makedev(1, 3));
              TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
              TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
              FS.mkdev("/dev/tty", FS.makedev(5, 0));
              FS.mkdev("/dev/tty1", FS.makedev(6, 0));
              var random_device = getRandomDevice();
              FS.createDevice("/dev", "random", random_device);
              FS.createDevice("/dev", "urandom", random_device);
              FS.mkdir("/dev/shm");
              FS.mkdir("/dev/shm/tmp")
          },
          createSpecialDirectories: () => {
              FS.mkdir("/proc");
              var proc_self = FS.mkdir("/proc/self");
              FS.mkdir("/proc/self/fd");
              FS.mount({
                  mount: () => {
                      var node = FS.createNode(proc_self, "fd", 16384 | 511, 73);
                      node.node_ops = {
                          lookup: (parent, name) => {
                              var fd = +name;
                              var stream = FS.getStream(fd);
                              if (!stream) throw new FS.ErrnoError(8);
                              var ret = {
                                  parent: null,
                                  mount: {
                                      mountpoint: "fake"
                                  },
                                  node_ops: {
                                      readlink: () => stream.path
                                  }
                              };
                              ret.parent = ret;
                              return ret
                          }
                      };
                      return node
                  }
              }, {}, "/proc/self/fd")
          },
          createStandardStreams: () => {
              if (Module["stdin"]) {
                  FS.createDevice("/dev", "stdin", Module["stdin"])
              } else {
                  FS.symlink("/dev/tty", "/dev/stdin")
              }
              if (Module["stdout"]) {
                  FS.createDevice("/dev", "stdout", null, Module["stdout"])
              } else {
                  FS.symlink("/dev/tty", "/dev/stdout")
              }
              if (Module["stderr"]) {
                  FS.createDevice("/dev", "stderr", null, Module["stderr"])
              } else {
                  FS.symlink("/dev/tty1", "/dev/stderr")
              }
              var stdin = FS.open("/dev/stdin", 0);
              var stdout = FS.open("/dev/stdout", 1);
              var stderr = FS.open("/dev/stderr", 1)
          },
          ensureErrnoError: () => {
              if (FS.ErrnoError) return;
              FS.ErrnoError = function ErrnoError(errno, node) {
                  this.node = node;
                  this.setErrno = function(errno) {
                      this.errno = errno
                  };
                  this.setErrno(errno);
                  this.message = "FS error"
              };
              FS.ErrnoError.prototype = new Error;
              FS.ErrnoError.prototype.constructor = FS.ErrnoError;
              [44].forEach(code => {
                  FS.genericErrors[code] = new FS.ErrnoError(code);
                  FS.genericErrors[code].stack = "<generic error, no stack>"
              })
          },
          staticInit: () => {
              FS.ensureErrnoError();
              FS.nameTable = new Array(4096);
              FS.mount(MEMFS, {}, "/");
              FS.createDefaultDirectories();
              FS.createDefaultDevices();
              FS.createSpecialDirectories();
              FS.filesystems = {
                  "MEMFS": MEMFS
              }
          },
          init: (input, output, error) => {
              FS.init.initialized = true;
              FS.ensureErrnoError();
              Module["stdin"] = input || Module["stdin"];
              Module["stdout"] = output || Module["stdout"];
              Module["stderr"] = error || Module["stderr"];
              FS.createStandardStreams()
          },
          quit: () => {
              FS.init.initialized = false;
              for (var i = 0; i < FS.streams.length; i++) {
                  var stream = FS.streams[i];
                  if (!stream) {
                      continue
                  }
                  FS.close(stream)
              }
          },
          getMode: (canRead, canWrite) => {
              var mode = 0;
              if (canRead) mode |= 292 | 73;
              if (canWrite) mode |= 146;
              return mode
          },
          findObject: (path, dontResolveLastLink) => {
              var ret = FS.analyzePath(path, dontResolveLastLink);
              if (ret.exists) {
                  return ret.object
              } else {
                  return null
              }
          },
          analyzePath: (path, dontResolveLastLink) => {
              try {
                  var lookup = FS.lookupPath(path, {
                      follow: !dontResolveLastLink
                  });
                  path = lookup.path
              } catch (e) {}
              var ret = {
                  isRoot: false,
                  exists: false,
                  error: 0,
                  name: null,
                  path: null,
                  object: null,
                  parentExists: false,
                  parentPath: null,
                  parentObject: null
              };
              try {
                  var lookup = FS.lookupPath(path, {
                      parent: true
                  });
                  ret.parentExists = true;
                  ret.parentPath = lookup.path;
                  ret.parentObject = lookup.node;
                  ret.name = PATH.basename(path);
                  lookup = FS.lookupPath(path, {
                      follow: !dontResolveLastLink
                  });
                  ret.exists = true;
                  ret.path = lookup.path;
                  ret.object = lookup.node;
                  ret.name = lookup.node.name;
                  ret.isRoot = lookup.path === "/"
              } catch (e) {
                  ret.error = e.errno
              }
              return ret
          },
          createPath: (parent, path, canRead, canWrite) => {
              parent = typeof parent == "string" ? parent : FS.getPath(parent);
              var parts = path.split("/").reverse();
              while (parts.length) {
                  var part = parts.pop();
                  if (!part) continue;
                  var current = PATH.join2(parent, part);
                  try {
                      FS.mkdir(current)
                  } catch (e) {}
                  parent = current
              }
              return current
          },
          createFile: (parent, name, properties, canRead, canWrite) => {
              var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
              var mode = FS.getMode(canRead, canWrite);
              return FS.create(path, mode)
          },
          createDataFile: (parent, name, data, canRead, canWrite, canOwn) => {
              var path = name;
              if (parent) {
                  parent = typeof parent == "string" ? parent : FS.getPath(parent);
                  path = name ? PATH.join2(parent, name) : parent
              }
              var mode = FS.getMode(canRead, canWrite);
              var node = FS.create(path, mode);
              if (data) {
                  if (typeof data == "string") {
                      var arr = new Array(data.length);
                      for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
                      data = arr
                  }
                  FS.chmod(node, mode | 146);
                  var stream = FS.open(node, 577);
                  FS.write(stream, data, 0, data.length, 0, canOwn);
                  FS.close(stream);
                  FS.chmod(node, mode)
              }
              return node
          },
          createDevice: (parent, name, input, output) => {
              var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
              var mode = FS.getMode(!!input, !!output);
              if (!FS.createDevice.major) FS.createDevice.major = 64;
              var dev = FS.makedev(FS.createDevice.major++, 0);
              FS.registerDevice(dev, {
                  open: stream => {
                      stream.seekable = false
                  },
                  close: stream => {
                      if (output && output.buffer && output.buffer.length) {
                          output(10)
                      }
                  },
                  read: (stream, buffer, offset, length, pos) => {
                      var bytesRead = 0;
                      for (var i = 0; i < length; i++) {
                          var result;
                          try {
                              result = input()
                          } catch (e) {
                              throw new FS.ErrnoError(29)
                          }
                          if (result === undefined && bytesRead === 0) {
                              throw new FS.ErrnoError(6)
                          }
                          if (result === null || result === undefined) break;
                          bytesRead++;
                          buffer[offset + i] = result
                      }
                      if (bytesRead) {
                          stream.node.timestamp = Date.now()
                      }
                      return bytesRead
                  },
                  write: (stream, buffer, offset, length, pos) => {
                      for (var i = 0; i < length; i++) {
                          try {
                              output(buffer[offset + i])
                          } catch (e) {
                              throw new FS.ErrnoError(29)
                          }
                      }
                      if (length) {
                          stream.node.timestamp = Date.now()
                      }
                      return i
                  }
              });
              return FS.mkdev(path, mode, dev)
          },
          forceLoadFile: obj => {
              if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
              if (typeof XMLHttpRequest != "undefined") {
                  throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.")
              } else if (read_) {
                  try {
                      obj.contents = intArrayFromString(read_(obj.url), true);
                      obj.usedBytes = obj.contents.length
                  } catch (e) {
                      throw new FS.ErrnoError(29)
                  }
              } else {
                  throw new Error("Cannot load without read() or XMLHttpRequest.")
              }
          },
          createLazyFile: (parent, name, url, canRead, canWrite) => {
              function LazyUint8Array() {
                  this.lengthKnown = false;
                  this.chunks = []
              }
              LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
                  if (idx > this.length - 1 || idx < 0) {
                      return undefined
                  }
                  var chunkOffset = idx % this.chunkSize;
                  var chunkNum = idx / this.chunkSize | 0;
                  return this.getter(chunkNum)[chunkOffset]
              };
              LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
                  this.getter = getter
              };
              LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
                  var xhr = new XMLHttpRequest;
                  xhr.open("HEAD", url, false);
                  xhr.send(null);
                  if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                  var datalength = Number(xhr.getResponseHeader("Content-length"));
                  var header;
                  var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
                  var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
                  var chunkSize = 1024 * 1024;
                  if (!hasByteServing) chunkSize = datalength;
                  var doXHR = (from, to) => {
                      if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                      if (to > datalength - 1) throw new Error("only " + datalength + " bytes available! programmer error!");
                      var xhr = new XMLHttpRequest;
                      xhr.open("GET", url, false);
                      if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                      xhr.responseType = "arraybuffer";
                      if (xhr.overrideMimeType) {
                          xhr.overrideMimeType("text/plain; charset=x-user-defined")
                      }
                      xhr.send(null);
                      if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                      if (xhr.response !== undefined) {
                          return new Uint8Array(xhr.response || [])
                      } else {
                          return intArrayFromString(xhr.responseText || "", true)
                      }
                  };
                  var lazyArray = this;
                  lazyArray.setDataGetter(chunkNum => {
                      var start = chunkNum * chunkSize;
                      var end = (chunkNum + 1) * chunkSize - 1;
                      end = Math.min(end, datalength - 1);
                      if (typeof lazyArray.chunks[chunkNum] == "undefined") {
                          lazyArray.chunks[chunkNum] = doXHR(start, end)
                      }
                      if (typeof lazyArray.chunks[chunkNum] == "undefined") throw new Error("doXHR failed!");
                      return lazyArray.chunks[chunkNum]
                  });
                  if (usesGzip || !datalength) {
                      chunkSize = datalength = 1;
                      datalength = this.getter(0).length;
                      chunkSize = datalength;
                      out("LazyFiles on gzip forces download of the whole file when length is accessed")
                  }
                  this._length = datalength;
                  this._chunkSize = chunkSize;
                  this.lengthKnown = true
              };
              if (typeof XMLHttpRequest != "undefined") {
                  if (!ENVIRONMENT_IS_WORKER) throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
                  var lazyArray = new LazyUint8Array;
                  Object.defineProperties(lazyArray, {
                      length: {
                          get: function() {
                              if (!this.lengthKnown) {
                                  this.cacheLength()
                              }
                              return this._length
                          }
                      },
                      chunkSize: {
                          get: function() {
                              if (!this.lengthKnown) {
                                  this.cacheLength()
                              }
                              return this._chunkSize
                          }
                      }
                  });
                  var properties = {
                      isDevice: false,
                      contents: lazyArray
                  }
              } else {
                  var properties = {
                      isDevice: false,
                      url: url
                  }
              }
              var node = FS.createFile(parent, name, properties, canRead, canWrite);
              if (properties.contents) {
                  node.contents = properties.contents
              } else if (properties.url) {
                  node.contents = null;
                  node.url = properties.url
              }
              Object.defineProperties(node, {
                  usedBytes: {
                      get: function() {
                          return this.contents.length
                      }
                  }
              });
              var stream_ops = {};
              var keys = Object.keys(node.stream_ops);
              keys.forEach(key => {
                  var fn = node.stream_ops[key];
                  stream_ops[key] = function forceLoadLazyFile() {
                      FS.forceLoadFile(node);
                      return fn.apply(null, arguments)
                  }
              });
              stream_ops.read = ((stream, buffer, offset, length, position) => {
                  FS.forceLoadFile(node);
                  var contents = stream.node.contents;
                  if (position >= contents.length) return 0;
                  var size = Math.min(contents.length - position, length);
                  if (contents.slice) {
                      for (var i = 0; i < size; i++) {
                          buffer[offset + i] = contents[position + i]
                      }
                  } else {
                      for (var i = 0; i < size; i++) {
                          buffer[offset + i] = contents.get(position + i)
                      }
                  }
                  return size
              });
              node.stream_ops = stream_ops;
              return node
          },
          createPreloadedFile: (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) => {
              var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
              var dep = getUniqueRunDependency("cp " + fullname);

              function processData(byteArray) {
                  function finish(byteArray) {
                      if (preFinish) preFinish();
                      if (!dontCreateFile) {
                          FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn)
                      }
                      if (onload) onload();
                      removeRunDependency(dep)
                  }
                  if (Browser.handledByPreloadPlugin(byteArray, fullname, finish, () => {
                          if (onerror) onerror();
                          removeRunDependency(dep)
                      })) {
                      return
                  }
                  finish(byteArray)
              }
              addRunDependency(dep);
              if (typeof url == "string") {
                  asyncLoad(url, byteArray => processData(byteArray), onerror)
              } else {
                  processData(url)
              }
          },
          indexedDB: () => {
              return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB
          },
          DB_NAME: () => {
              return "EM_FS_" + window.location.pathname
          },
          DB_VERSION: 20,
          DB_STORE_NAME: "FILE_DATA",
          saveFilesToDB: (paths, onload, onerror) => {
              onload = onload || (() => {});
              onerror = onerror || (() => {});
              var indexedDB = FS.indexedDB();
              try {
                  var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION)
              } catch (e) {
                  return onerror(e)
              }
              openRequest.onupgradeneeded = (() => {
                  out("creating db");
                  var db = openRequest.result;
                  db.createObjectStore(FS.DB_STORE_NAME)
              });
              openRequest.onsuccess = (() => {
                  var db = openRequest.result;
                  var transaction = db.transaction([FS.DB_STORE_NAME], "readwrite");
                  var files = transaction.objectStore(FS.DB_STORE_NAME);
                  var ok = 0,
                      fail = 0,
                      total = paths.length;

                  function finish() {
                      if (fail == 0) onload();
                      else onerror()
                  }
                  paths.forEach(path => {
                      var putRequest = files.put(FS.analyzePath(path).object.contents, path);
                      putRequest.onsuccess = (() => {
                          ok++;
                          if (ok + fail == total) finish()
                      });
                      putRequest.onerror = (() => {
                          fail++;
                          if (ok + fail == total) finish()
                      })
                  });
                  transaction.onerror = onerror
              });
              openRequest.onerror = onerror
          },
          loadFilesFromDB: (paths, onload, onerror) => {
              onload = onload || (() => {});
              onerror = onerror || (() => {});
              var indexedDB = FS.indexedDB();
              try {
                  var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION)
              } catch (e) {
                  return onerror(e)
              }
              openRequest.onupgradeneeded = onerror;
              openRequest.onsuccess = (() => {
                  var db = openRequest.result;
                  try {
                      var transaction = db.transaction([FS.DB_STORE_NAME], "readonly")
                  } catch (e) {
                      onerror(e);
                      return
                  }
                  var files = transaction.objectStore(FS.DB_STORE_NAME);
                  var ok = 0,
                      fail = 0,
                      total = paths.length;

                  function finish() {
                      if (fail == 0) onload();
                      else onerror()
                  }
                  paths.forEach(path => {
                      var getRequest = files.get(path);
                      getRequest.onsuccess = (() => {
                          if (FS.analyzePath(path).exists) {
                              FS.unlink(path)
                          }
                          FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
                          ok++;
                          if (ok + fail == total) finish()
                      });
                      getRequest.onerror = (() => {
                          fail++;
                          if (ok + fail == total) finish()
                      })
                  });
                  transaction.onerror = onerror
              });
              openRequest.onerror = onerror
          }
      };
      var SYSCALLS = {
          DEFAULT_POLLMASK: 5,
          calculateAt: function(dirfd, path, allowEmpty) {
              if (PATH.isAbs(path)) {
                  return path
              }
              var dir;
              if (dirfd === -100) {
                  dir = FS.cwd()
              } else {
                  var dirstream = FS.getStream(dirfd);
                  if (!dirstream) throw new FS.ErrnoError(8);
                  dir = dirstream.path
              }
              if (path.length == 0) {
                  if (!allowEmpty) {
                      throw new FS.ErrnoError(44)
                  }
                  return dir
              }
              return PATH.join2(dir, path)
          },
          doStat: function(func, path, buf) {
              try {
                  var stat = func(path)
              } catch (e) {
                  if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
                      return -54
                  }
                  throw e
              }
              HEAP32[buf >> 2] = stat.dev;
              HEAP32[buf + 4 >> 2] = 0;
              HEAP32[buf + 8 >> 2] = stat.ino;
              HEAP32[buf + 12 >> 2] = stat.mode;
              HEAP32[buf + 16 >> 2] = stat.nlink;
              HEAP32[buf + 20 >> 2] = stat.uid;
              HEAP32[buf + 24 >> 2] = stat.gid;
              HEAP32[buf + 28 >> 2] = stat.rdev;
              HEAP32[buf + 32 >> 2] = 0;
              tempI64 = [stat.size >>> 0, (tempDouble = stat.size, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[buf + 40 >> 2] = tempI64[0], HEAP32[buf + 44 >> 2] = tempI64[1];
              HEAP32[buf + 48 >> 2] = 4096;
              HEAP32[buf + 52 >> 2] = stat.blocks;
              HEAP32[buf + 56 >> 2] = stat.atime.getTime() / 1e3 | 0;
              HEAP32[buf + 60 >> 2] = 0;
              HEAP32[buf + 64 >> 2] = stat.mtime.getTime() / 1e3 | 0;
              HEAP32[buf + 68 >> 2] = 0;
              HEAP32[buf + 72 >> 2] = stat.ctime.getTime() / 1e3 | 0;
              HEAP32[buf + 76 >> 2] = 0;
              tempI64 = [stat.ino >>> 0, (tempDouble = stat.ino, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[buf + 80 >> 2] = tempI64[0], HEAP32[buf + 84 >> 2] = tempI64[1];
              return 0
          },
          doMsync: function(addr, stream, len, flags, offset) {
              var buffer = HEAPU8.slice(addr, addr + len);
              FS.msync(stream, buffer, offset, len, flags)
          },
          varargs: undefined,
          get: function() {
              SYSCALLS.varargs += 4;
              var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];
              return ret
          },
          getStr: function(ptr) {
              var ret = UTF8ToString(ptr);
              return ret
          },
          getStreamFromFD: function(fd) {
              var stream = FS.getStream(fd);
              if (!stream) throw new FS.ErrnoError(8);
              return stream
          }
      };

      function ___syscall_fcntl64(fd, cmd, varargs) {
          SYSCALLS.varargs = varargs;
          try {
              var stream = SYSCALLS.getStreamFromFD(fd);
              switch (cmd) {
                  case 0: {
                      var arg = SYSCALLS.get();
                      if (arg < 0) {
                          return -28
                      }
                      var newStream;
                      newStream = FS.createStream(stream, arg);
                      return newStream.fd
                  }
                  case 1:
                  case 2:
                      return 0;
                  case 3:
                      return stream.flags;
                  case 4: {
                      var arg = SYSCALLS.get();
                      stream.flags |= arg;
                      return 0
                  }
                  case 5: {
                      var arg = SYSCALLS.get();
                      var offset = 0;
                      HEAP16[arg + offset >> 1] = 2;
                      return 0
                  }
                  case 6:
                  case 7:
                      return 0;
                  case 16:
                  case 8:
                      return -28;
                  case 9:
                      setErrNo(28);
                      return -1;
                  default: {
                      return -28
                  }
              }
          } catch (e) {
              if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
              return -e.errno
          }
      }

      function ___syscall_fdatasync(fd) {
          try {
              var stream = SYSCALLS.getStreamFromFD(fd);
              return 0
          } catch (e) {
              if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
              return -e.errno
          }
      }

      function ___syscall_ftruncate64(fd, length_low, length_high) {
          try {
              var length = length_high * 4294967296 + (length_low >>> 0);
              FS.ftruncate(fd, length);
              return 0
          } catch (e) {
              if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
              return -e.errno
          }
      }

      function ___syscall_ioctl(fd, op, varargs) {
          SYSCALLS.varargs = varargs;
          try {
              var stream = SYSCALLS.getStreamFromFD(fd);
              switch (op) {
                  case 21509:
                  case 21505: {
                      if (!stream.tty) return -59;
                      return 0
                  }
                  case 21510:
                  case 21511:
                  case 21512:
                  case 21506:
                  case 21507:
                  case 21508: {
                      if (!stream.tty) return -59;
                      return 0
                  }
                  case 21519: {
                      if (!stream.tty) return -59;
                      var argp = SYSCALLS.get();
                      HEAP32[argp >> 2] = 0;
                      return 0
                  }
                  case 21520: {
                      if (!stream.tty) return -59;
                      return -28
                  }
                  case 21531: {
                      var argp = SYSCALLS.get();
                      return FS.ioctl(stream, op, argp)
                  }
                  case 21523: {
                      if (!stream.tty) return -59;
                      return 0
                  }
                  case 21524: {
                      if (!stream.tty) return -59;
                      return 0
                  }
                  default:
                      abort("bad ioctl syscall " + op)
              }
          } catch (e) {
              if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
              return -e.errno
          }
      }

      function ___syscall_mkdirat(dirfd, path, mode) {
          try {
              path = SYSCALLS.getStr(path);
              path = SYSCALLS.calculateAt(dirfd, path);
              path = PATH.normalize(path);
              if (path[path.length - 1] === "/") path = path.substr(0, path.length - 1);
              FS.mkdir(path, mode, 0);
              return 0
          } catch (e) {
              if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
              return -e.errno
          }
      }

      function ___syscall_openat(dirfd, path, flags, varargs) {
          SYSCALLS.varargs = varargs;
          try {
              path = SYSCALLS.getStr(path);
              path = SYSCALLS.calculateAt(dirfd, path);
              var mode = varargs ? SYSCALLS.get() : 0;
              return FS.open(path, flags, mode).fd
          } catch (e) {
              if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
              return -e.errno
          }
      }

      function ___syscall_renameat(olddirfd, oldpath, newdirfd, newpath) {
          try {
              oldpath = SYSCALLS.getStr(oldpath);
              newpath = SYSCALLS.getStr(newpath);
              oldpath = SYSCALLS.calculateAt(olddirfd, oldpath);
              newpath = SYSCALLS.calculateAt(newdirfd, newpath);
              FS.rename(oldpath, newpath);
              return 0
          } catch (e) {
              if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
              return -e.errno
          }
      }

      function ___syscall_stat64(path, buf) {
          try {
              path = SYSCALLS.getStr(path);
              return SYSCALLS.doStat(FS.stat, path, buf)
          } catch (e) {
              if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
              return -e.errno
          }
      }

      function __embind_register_bigint(primitiveType, name, size, minRange, maxRange) {}

      function getShiftFromSize(size) {
          switch (size) {
              case 1:
                  return 0;
              case 2:
                  return 1;
              case 4:
                  return 2;
              case 8:
                  return 3;
              default:
                  throw new TypeError("Unknown type size: " + size)
          }
      }

      function embind_init_charCodes() {
          var codes = new Array(256);
          for (var i = 0; i < 256; ++i) {
              codes[i] = String.fromCharCode(i)
          }
          embind_charCodes = codes
      }
      var embind_charCodes = undefined;

      function readLatin1String(ptr) {
          var ret = "";
          var c = ptr;
          while (HEAPU8[c]) {
              ret += embind_charCodes[HEAPU8[c++]]
          }
          return ret
      }
      var awaitingDependencies = {};
      var registeredTypes = {};
      var typeDependencies = {};
      var char_0 = 48;
      var char_9 = 57;

      function makeLegalFunctionName(name) {
          if (undefined === name) {
              return "_unknown"
          }
          name = name.replace(/[^a-zA-Z0-9_]/g, "$");
          var f = name.charCodeAt(0);
          if (f >= char_0 && f <= char_9) {
              return "_" + name
          }
          return name
      }

      function createNamedFunction(name, body) {
          name = makeLegalFunctionName(name);
          return function() {
              null;
              return body.apply(this, arguments)
          }
      }

      function extendError(baseErrorType, errorName) {
          var errorClass = createNamedFunction(errorName, function(message) {
              this.name = errorName;
              this.message = message;
              var stack = new Error(message).stack;
              if (stack !== undefined) {
                  this.stack = this.toString() + "\n" + stack.replace(/^Error(:[^\n]*)?\n/, "")
              }
          });
          errorClass.prototype = Object.create(baseErrorType.prototype);
          errorClass.prototype.constructor = errorClass;
          errorClass.prototype.toString = function() {
              if (this.message === undefined) {
                  return this.name
              } else {
                  return this.name + ": " + this.message
              }
          };
          return errorClass
      }
      var BindingError = undefined;

      function throwBindingError(message) {
          throw new BindingError(message)
      }
      var InternalError = undefined;

      function throwInternalError(message) {
          throw new InternalError(message)
      }

      function whenDependentTypesAreResolved(myTypes, dependentTypes, getTypeConverters) {
          myTypes.forEach(function(type) {
              typeDependencies[type] = dependentTypes
          });

          function onComplete(typeConverters) {
              var myTypeConverters = getTypeConverters(typeConverters);
              if (myTypeConverters.length !== myTypes.length) {
                  throwInternalError("Mismatched type converter count")
              }
              for (var i = 0; i < myTypes.length; ++i) {
                  registerType(myTypes[i], myTypeConverters[i])
              }
          }
          var typeConverters = new Array(dependentTypes.length);
          var unregisteredTypes = [];
          var registered = 0;
          dependentTypes.forEach((dt, i) => {
              if (registeredTypes.hasOwnProperty(dt)) {
                  typeConverters[i] = registeredTypes[dt]
              } else {
                  unregisteredTypes.push(dt);
                  if (!awaitingDependencies.hasOwnProperty(dt)) {
                      awaitingDependencies[dt] = []
                  }
                  awaitingDependencies[dt].push(() => {
                      typeConverters[i] = registeredTypes[dt];
                      ++registered;
                      if (registered === unregisteredTypes.length) {
                          onComplete(typeConverters)
                      }
                  })
              }
          });
          if (0 === unregisteredTypes.length) {
              onComplete(typeConverters)
          }
      }

      function registerType(rawType, registeredInstance, options = {}) {
          if (!("argPackAdvance" in registeredInstance)) {
              throw new TypeError("registerType registeredInstance requires argPackAdvance")
          }
          var name = registeredInstance.name;
          if (!rawType) {
              throwBindingError('type "' + name + '" must have a positive integer typeid pointer')
          }
          if (registeredTypes.hasOwnProperty(rawType)) {
              if (options.ignoreDuplicateRegistrations) {
                  return
              } else {
                  throwBindingError("Cannot register type '" + name + "' twice")
              }
          }
          registeredTypes[rawType] = registeredInstance;
          delete typeDependencies[rawType];
          if (awaitingDependencies.hasOwnProperty(rawType)) {
              var callbacks = awaitingDependencies[rawType];
              delete awaitingDependencies[rawType];
              callbacks.forEach(cb => cb())
          }
      }

      function __embind_register_bool(rawType, name, size, trueValue, falseValue) {
          var shift = getShiftFromSize(size);
          name = readLatin1String(name);
          registerType(rawType, {
              name: name,
              "fromWireType": function(wt) {
                  return !!wt
              },
              "toWireType": function(destructors, o) {
                  return o ? trueValue : falseValue
              },
              "argPackAdvance": 8,
              "readValueFromPointer": function(pointer) {
                  var heap;
                  if (size === 1) {
                      heap = HEAP8
                  } else if (size === 2) {
                      heap = HEAP16
                  } else if (size === 4) {
                      heap = HEAP32
                  } else {
                      throw new TypeError("Unknown boolean type size: " + name)
                  }
                  return this["fromWireType"](heap[pointer >> shift])
              },
              destructorFunction: null
          })
      }
      var emval_free_list = [];
      var emval_handle_array = [{}, {
          value: undefined
      }, {
          value: null
      }, {
          value: true
      }, {
          value: false
      }];

      function __emval_decref(handle) {
          if (handle > 4 && 0 === --emval_handle_array[handle].refcount) {
              emval_handle_array[handle] = undefined;
              emval_free_list.push(handle)
          }
      }

      function count_emval_handles() {
          var count = 0;
          for (var i = 5; i < emval_handle_array.length; ++i) {
              if (emval_handle_array[i] !== undefined) {
                  ++count
              }
          }
          return count
      }

      function get_first_emval() {
          for (var i = 5; i < emval_handle_array.length; ++i) {
              if (emval_handle_array[i] !== undefined) {
                  return emval_handle_array[i]
              }
          }
          return null
      }

      function init_emval() {
          Module["count_emval_handles"] = count_emval_handles;
          Module["get_first_emval"] = get_first_emval
      }
      var Emval = {
          toValue: handle => {
              if (!handle) {
                  throwBindingError("Cannot use deleted val. handle = " + handle)
              }
              return emval_handle_array[handle].value
          },
          toHandle: value => {
              switch (value) {
                  case undefined:
                      return 1;
                  case null:
                      return 2;
                  case true:
                      return 3;
                  case false:
                      return 4;
                  default: {
                      var handle = emval_free_list.length ? emval_free_list.pop() : emval_handle_array.length;
                      emval_handle_array[handle] = {
                          refcount: 1,
                          value: value
                      };
                      return handle
                  }
              }
          }
      };

      function simpleReadValueFromPointer(pointer) {
          return this["fromWireType"](HEAPU32[pointer >> 2])
      }

      function __embind_register_emval(rawType, name) {
          name = readLatin1String(name);
          registerType(rawType, {
              name: name,
              "fromWireType": function(handle) {
                  var rv = Emval.toValue(handle);
                  __emval_decref(handle);
                  return rv
              },
              "toWireType": function(destructors, value) {
                  return Emval.toHandle(value)
              },
              "argPackAdvance": 8,
              "readValueFromPointer": simpleReadValueFromPointer,
              destructorFunction: null
          })
      }

      function floatReadValueFromPointer(name, shift) {
          switch (shift) {
              case 2:
                  return function(pointer) {
                      return this["fromWireType"](HEAPF32[pointer >> 2])
                  };
              case 3:
                  return function(pointer) {
                      return this["fromWireType"](HEAPF64[pointer >> 3])
                  };
              default:
                  throw new TypeError("Unknown float type: " + name)
          }
      }

      function __embind_register_float(rawType, name, size) {
          var shift = getShiftFromSize(size);
          name = readLatin1String(name);
          registerType(rawType, {
              name: name,
              "fromWireType": function(value) {
                  return value
              },
              "toWireType": function(destructors, value) {
                  return value
              },
              "argPackAdvance": 8,
              "readValueFromPointer": floatReadValueFromPointer(name, shift),
              destructorFunction: null
          })
      }

      function runDestructors(destructors) {
          while (destructors.length) {
              var ptr = destructors.pop();
              var del = destructors.pop();
              del(ptr)
          }
      }

      function runAndAbortIfError(func) {
          try {
              return func()
          } catch (e) {
              abort(e)
          }
      }

      function callUserCallback(func, synchronous) {
          if (ABORT) {
              return
          }
          if (synchronous) {
              func();
              return
          }
          try {
              func()
          } catch (e) {
              handleException(e)
          }
      }
      var Asyncify = {
          State: {
              Normal: 0,
              Unwinding: 1,
              Rewinding: 2,
              Disabled: 3
          },
          state: 0,
          StackSize: 4096,
          currData: null,
          handleSleepReturnValue: 0,
          exportCallStack: [],
          callStackNameToId: {},
          callStackIdToName: {},
          callStackId: 0,
          asyncPromiseHandlers: null,
          sleepCallbacks: [],
          getCallStackId: function(funcName) {
              var id = Asyncify.callStackNameToId[funcName];
              if (id === undefined) {
                  id = Asyncify.callStackId++;
                  Asyncify.callStackNameToId[funcName] = id;
                  Asyncify.callStackIdToName[id] = funcName
              }
              return id
          },
          instrumentWasmExports: function(exports) {
              var ret = {};
              for (var x in exports) {
                  (function(x) {
                      var original = exports[x];
                      if (typeof original == "function") {
                          ret[x] = function() {
                              Asyncify.exportCallStack.push(x);
                              try {
                                  return original.apply(null, arguments)
                              } finally {
                                  if (!ABORT) {
                                      var y = Asyncify.exportCallStack.pop();
                                      assert(y === x);
                                      Asyncify.maybeStopUnwind()
                                  }
                              }
                          }
                      } else {
                          ret[x] = original
                      }
                  })(x)
              }
              return ret
          },
          maybeStopUnwind: function() {
              if (Asyncify.currData && Asyncify.state === Asyncify.State.Unwinding && Asyncify.exportCallStack.length === 0) {
                  Asyncify.state = Asyncify.State.Normal;
                  runAndAbortIfError(Module["_asyncify_stop_unwind"]);
                  if (typeof Fibers != "undefined") {
                      Fibers.trampoline()
                  }
              }
          },
          whenDone: function() {
              return new Promise((resolve, reject) => {
                  Asyncify.asyncPromiseHandlers = {
                      resolve: resolve,
                      reject: reject
                  }
              })
          },
          allocateData: function() {
              var ptr = _malloc(12 + Asyncify.StackSize);
              Asyncify.setDataHeader(ptr, ptr + 12, Asyncify.StackSize);
              Asyncify.setDataRewindFunc(ptr);
              return ptr
          },
          setDataHeader: function(ptr, stack, stackSize) {
              HEAP32[ptr >> 2] = stack;
              HEAP32[ptr + 4 >> 2] = stack + stackSize
          },
          setDataRewindFunc: function(ptr) {
              var bottomOfCallStack = Asyncify.exportCallStack[0];
              var rewindId = Asyncify.getCallStackId(bottomOfCallStack);
              HEAP32[ptr + 8 >> 2] = rewindId
          },
          getDataRewindFunc: function(ptr) {
              var id = HEAP32[ptr + 8 >> 2];
              var name = Asyncify.callStackIdToName[id];
              var func = Module["asm"][name];
              return func
          },
          doRewind: function(ptr) {
              var start = Asyncify.getDataRewindFunc(ptr);
              return start()
          },
          handleSleep: function(startAsync) {
              if (ABORT) return;
              if (Asyncify.state === Asyncify.State.Normal) {
                  var reachedCallback = false;
                  var reachedAfterCallback = false;
                  startAsync(handleSleepReturnValue => {
                      if (ABORT) return;
                      Asyncify.handleSleepReturnValue = handleSleepReturnValue || 0;
                      reachedCallback = true;
                      if (!reachedAfterCallback) {
                          return
                      }
                      Asyncify.state = Asyncify.State.Rewinding;
                      runAndAbortIfError(() => Module["_asyncify_start_rewind"](Asyncify.currData));
                      if (typeof Browser != "undefined" && Browser.mainLoop.func) {
                          Browser.mainLoop.resume()
                      }
                      var asyncWasmReturnValue, isError = false;
                      try {
                          asyncWasmReturnValue = Asyncify.doRewind(Asyncify.currData)
                      } catch (err) {
                          asyncWasmReturnValue = err;
                          isError = true
                      }
                      var handled = false;
                      if (!Asyncify.currData) {
                          var asyncPromiseHandlers = Asyncify.asyncPromiseHandlers;
                          if (asyncPromiseHandlers) {
                              Asyncify.asyncPromiseHandlers = null;
                              (isError ? asyncPromiseHandlers.reject : asyncPromiseHandlers.resolve)(asyncWasmReturnValue);
                              handled = true
                          }
                      }
                      if (isError && !handled) {
                          throw asyncWasmReturnValue
                      }
                  });
                  reachedAfterCallback = true;
                  if (!reachedCallback) {
                      Asyncify.state = Asyncify.State.Unwinding;
                      Asyncify.currData = Asyncify.allocateData();
                      runAndAbortIfError(() => Module["_asyncify_start_unwind"](Asyncify.currData));
                      if (typeof Browser != "undefined" && Browser.mainLoop.func) {
                          Browser.mainLoop.pause()
                      }
                  }
              } else if (Asyncify.state === Asyncify.State.Rewinding) {
                  Asyncify.state = Asyncify.State.Normal;
                  runAndAbortIfError(Module["_asyncify_stop_rewind"]);
                  _free(Asyncify.currData);
                  Asyncify.currData = null;
                  Asyncify.sleepCallbacks.forEach(func => callUserCallback(func))
              } else {
                  abort("invalid state: " + Asyncify.state)
              }
              return Asyncify.handleSleepReturnValue
          },
          handleAsync: function(startAsync) {
              return Asyncify.handleSleep(wakeUp => {
                  startAsync().then(wakeUp)
              })
          }
      };

      function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc) {
          var argCount = argTypes.length;
          if (argCount < 2) {
              throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!")
          }
          var isClassMethodFunc = argTypes[1] !== null && classType !== null;
          var needsDestructorStack = false;
          for (var i = 1; i < argTypes.length; ++i) {
              if (argTypes[i] !== null && argTypes[i].destructorFunction === undefined) {
                  needsDestructorStack = true;
                  break
              }
          }
          var returns = argTypes[0].name !== "void";
          var expectedArgCount = argCount - 2;
          var argsWired = new Array(expectedArgCount);
          var invokerFuncArgs = [];
          var destructors = [];
          return function() {
              if (arguments.length !== expectedArgCount) {
                  throwBindingError("function " + humanName + " called with " + arguments.length + " arguments, expected " + expectedArgCount + " args!")
              }
              destructors.length = 0;
              var thisWired;
              invokerFuncArgs.length = isClassMethodFunc ? 2 : 1;
              invokerFuncArgs[0] = cppTargetFunc;
              if (isClassMethodFunc) {
                  thisWired = argTypes[1]["toWireType"](destructors, this);
                  invokerFuncArgs[1] = thisWired
              }
              for (var i = 0; i < expectedArgCount; ++i) {
                  argsWired[i] = argTypes[i + 2]["toWireType"](destructors, arguments[i]);
                  invokerFuncArgs.push(argsWired[i])
              }
              var rv = cppInvokerFunc.apply(null, invokerFuncArgs);

              function onDone(rv) {
                  if (needsDestructorStack) {
                      runDestructors(destructors)
                  } else {
                      for (var i = isClassMethodFunc ? 1 : 2; i < argTypes.length; i++) {
                          var param = i === 1 ? thisWired : argsWired[i - 2];
                          if (argTypes[i].destructorFunction !== null) {
                              argTypes[i].destructorFunction(param)
                          }
                      }
                  }
                  if (returns) {
                      return argTypes[0]["fromWireType"](rv)
                  }
              }
              if (Asyncify.currData) {
                  return Asyncify.whenDone().then(onDone)
              }
              return onDone(rv)
          }
      }

      function ensureOverloadTable(proto, methodName, humanName) {
          if (undefined === proto[methodName].overloadTable) {
              var prevFunc = proto[methodName];
              proto[methodName] = function() {
                  if (!proto[methodName].overloadTable.hasOwnProperty(arguments.length)) {
                      throwBindingError("Function '" + humanName + "' called with an invalid number of arguments (" + arguments.length + ") - expects one of (" + proto[methodName].overloadTable + ")!")
                  }
                  return proto[methodName].overloadTable[arguments.length].apply(this, arguments)
              };
              proto[methodName].overloadTable = [];
              proto[methodName].overloadTable[prevFunc.argCount] = prevFunc
          }
      }

      function exposePublicSymbol(name, value, numArguments) {
          if (Module.hasOwnProperty(name)) {
              if (undefined === numArguments || undefined !== Module[name].overloadTable && undefined !== Module[name].overloadTable[numArguments]) {
                  throwBindingError("Cannot register public name '" + name + "' twice")
              }
              ensureOverloadTable(Module, name, name);
              if (Module.hasOwnProperty(numArguments)) {
                  throwBindingError("Cannot register multiple overloads of a function with the same number of arguments (" + numArguments + ")!")
              }
              Module[name].overloadTable[numArguments] = value
          } else {
              Module[name] = value;
              if (undefined !== numArguments) {
                  Module[name].numArguments = numArguments
              }
          }
      }

      function heap32VectorToArray(count, firstElement) {
          var array = [];
          for (var i = 0; i < count; i++) {
              array.push(HEAP32[(firstElement >> 2) + i])
          }
          return array
      }

      function replacePublicSymbol(name, value, numArguments) {
          if (!Module.hasOwnProperty(name)) {
              throwInternalError("Replacing nonexistant public symbol")
          }
          if (undefined !== Module[name].overloadTable && undefined !== numArguments) {
              Module[name].overloadTable[numArguments] = value
          } else {
              Module[name] = value;
              Module[name].argCount = numArguments
          }
      }

      function dynCallLegacy(sig, ptr, args) {
          var f = Module["dynCall_" + sig];
          return args && args.length ? f.apply(null, [ptr].concat(args)) : f.call(null, ptr)
      }

      function dynCall(sig, ptr, args) {
          return dynCallLegacy(sig, ptr, args)
      }

      function getDynCaller(sig, ptr) {
          var argCache = [];
          return function() {
              argCache.length = 0;
              Object.assign(argCache, arguments);
              return dynCall(sig, ptr, argCache)
          }
      }

      function embind__requireFunction(signature, rawFunction) {
          signature = readLatin1String(signature);

          function makeDynCaller() {
              return getDynCaller(signature, rawFunction)
          }
          var fp = makeDynCaller();
          if (typeof fp != "function") {
              throwBindingError("unknown function pointer with signature " + signature + ": " + rawFunction)
          }
          return fp
      }
      var UnboundTypeError = undefined;

      function getTypeName(type) {
          var ptr = ___getTypeName(type);
          var rv = readLatin1String(ptr);
          _free(ptr);
          return rv
      }

      function throwUnboundTypeError(message, types) {
          var unboundTypes = [];
          var seen = {};

          function visit(type) {
              if (seen[type]) {
                  return
              }
              if (registeredTypes[type]) {
                  return
              }
              if (typeDependencies[type]) {
                  typeDependencies[type].forEach(visit);
                  return
              }
              unboundTypes.push(type);
              seen[type] = true
          }
          types.forEach(visit);
          throw new UnboundTypeError(message + ": " + unboundTypes.map(getTypeName).join([", "]))
      }

      function __embind_register_function(name, argCount, rawArgTypesAddr, signature, rawInvoker, fn) {
          var argTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
          name = readLatin1String(name);
          rawInvoker = embind__requireFunction(signature, rawInvoker);
          exposePublicSymbol(name, function() {
              throwUnboundTypeError("Cannot call " + name + " due to unbound types", argTypes)
          }, argCount - 1);
          whenDependentTypesAreResolved([], argTypes, function(argTypes) {
              var invokerArgsArray = [argTypes[0], null].concat(argTypes.slice(1));
              replacePublicSymbol(name, craftInvokerFunction(name, invokerArgsArray, null, rawInvoker, fn), argCount - 1);
              return []
          })
      }

      function integerReadValueFromPointer(name, shift, signed) {
          switch (shift) {
              case 0:
                  return signed ? function readS8FromPointer(pointer) {
                      return HEAP8[pointer]
                  } : function readU8FromPointer(pointer) {
                      return HEAPU8[pointer]
                  };
              case 1:
                  return signed ? function readS16FromPointer(pointer) {
                      return HEAP16[pointer >> 1]
                  } : function readU16FromPointer(pointer) {
                      return HEAPU16[pointer >> 1]
                  };
              case 2:
                  return signed ? function readS32FromPointer(pointer) {
                      return HEAP32[pointer >> 2]
                  } : function readU32FromPointer(pointer) {
                      return HEAPU32[pointer >> 2]
                  };
              default:
                  throw new TypeError("Unknown integer type: " + name)
          }
      }

      function __embind_register_integer(primitiveType, name, size, minRange, maxRange) {
          name = readLatin1String(name);
          if (maxRange === -1) {
              maxRange = 4294967295
          }
          var shift = getShiftFromSize(size);
          var fromWireType = value => value;
          if (minRange === 0) {
              var bitshift = 32 - 8 * size;
              fromWireType = (value => value << bitshift >>> bitshift)
          }
          var isUnsignedType = name.includes("unsigned");
          var checkAssertions = (value, toTypeName) => {};
          var toWireType;
          if (isUnsignedType) {
              toWireType = function(destructors, value) {
                  checkAssertions(value, this.name);
                  return value >>> 0
              }
          } else {
              toWireType = function(destructors, value) {
                  checkAssertions(value, this.name);
                  return value
              }
          }
          registerType(primitiveType, {
              name: name,
              "fromWireType": fromWireType,
              "toWireType": toWireType,
              "argPackAdvance": 8,
              "readValueFromPointer": integerReadValueFromPointer(name, shift, minRange !== 0),
              destructorFunction: null
          })
      }

      function __embind_register_memory_view(rawType, dataTypeIndex, name) {
          var typeMapping = [Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array];
          var TA = typeMapping[dataTypeIndex];

          function decodeMemoryView(handle) {
              handle = handle >> 2;
              var heap = HEAPU32;
              var size = heap[handle];
              var data = heap[handle + 1];
              return new TA(buffer, data, size)
          }
          name = readLatin1String(name);
          registerType(rawType, {
              name: name,
              "fromWireType": decodeMemoryView,
              "argPackAdvance": 8,
              "readValueFromPointer": decodeMemoryView
          }, {
              ignoreDuplicateRegistrations: true
          })
      }

      function __embind_register_std_string(rawType, name) {
          name = readLatin1String(name);
          var stdStringIsUTF8 = name === "std::string";
          registerType(rawType, {
              name: name,
              "fromWireType": function(value) {
                  var length = HEAPU32[value >> 2];
                  var str;
                  if (stdStringIsUTF8) {
                      var decodeStartPtr = value + 4;
                      for (var i = 0; i <= length; ++i) {
                          var currentBytePtr = value + 4 + i;
                          if (i == length || HEAPU8[currentBytePtr] == 0) {
                              var maxRead = currentBytePtr - decodeStartPtr;
                              var stringSegment = UTF8ToString(decodeStartPtr, maxRead);
                              if (str === undefined) {
                                  str = stringSegment
                              } else {
                                  str += String.fromCharCode(0);
                                  str += stringSegment
                              }
                              decodeStartPtr = currentBytePtr + 1
                          }
                      }
                  } else {
                      var a = new Array(length);
                      for (var i = 0; i < length; ++i) {
                          a[i] = String.fromCharCode(HEAPU8[value + 4 + i])
                      }
                      str = a.join("")
                  }
                  _free(value);
                  return str
              },
              "toWireType": function(destructors, value) {
                  if (value instanceof ArrayBuffer) {
                      value = new Uint8Array(value)
                  }
                  var getLength;
                  var valueIsOfTypeString = typeof value == "string";
                  if (!(valueIsOfTypeString || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Int8Array)) {
                      throwBindingError("Cannot pass non-string to std::string")
                  }
                  if (stdStringIsUTF8 && valueIsOfTypeString) {
                      getLength = (() => lengthBytesUTF8(value))
                  } else {
                      getLength = (() => value.length)
                  }
                  var length = getLength();
                  var ptr = _malloc(4 + length + 1);
                  HEAPU32[ptr >> 2] = length;
                  if (stdStringIsUTF8 && valueIsOfTypeString) {
                      stringToUTF8(value, ptr + 4, length + 1)
                  } else {
                      if (valueIsOfTypeString) {
                          for (var i = 0; i < length; ++i) {
                              var charCode = value.charCodeAt(i);
                              if (charCode > 255) {
                                  _free(ptr);
                                  throwBindingError("String has UTF-16 code units that do not fit in 8 bits")
                              }
                              HEAPU8[ptr + 4 + i] = charCode
                          }
                      } else {
                          for (var i = 0; i < length; ++i) {
                              HEAPU8[ptr + 4 + i] = value[i]
                          }
                      }
                  }
                  if (destructors !== null) {
                      destructors.push(_free, ptr)
                  }
                  return ptr
              },
              "argPackAdvance": 8,
              "readValueFromPointer": simpleReadValueFromPointer,
              destructorFunction: function(ptr) {
                  _free(ptr)
              }
          })
      }

      function __embind_register_std_wstring(rawType, charSize, name) {
          name = readLatin1String(name);
          var decodeString, encodeString, getHeap, lengthBytesUTF, shift;
          if (charSize === 2) {
              decodeString = UTF16ToString;
              encodeString = stringToUTF16;
              lengthBytesUTF = lengthBytesUTF16;
              getHeap = (() => HEAPU16);
              shift = 1
          } else if (charSize === 4) {
              decodeString = UTF32ToString;
              encodeString = stringToUTF32;
              lengthBytesUTF = lengthBytesUTF32;
              getHeap = (() => HEAPU32);
              shift = 2
          }
          registerType(rawType, {
              name: name,
              "fromWireType": function(value) {
                  var length = HEAPU32[value >> 2];
                  var HEAP = getHeap();
                  var str;
                  var decodeStartPtr = value + 4;
                  for (var i = 0; i <= length; ++i) {
                      var currentBytePtr = value + 4 + i * charSize;
                      if (i == length || HEAP[currentBytePtr >> shift] == 0) {
                          var maxReadBytes = currentBytePtr - decodeStartPtr;
                          var stringSegment = decodeString(decodeStartPtr, maxReadBytes);
                          if (str === undefined) {
                              str = stringSegment
                          } else {
                              str += String.fromCharCode(0);
                              str += stringSegment
                          }
                          decodeStartPtr = currentBytePtr + charSize
                      }
                  }
                  _free(value);
                  return str
              },
              "toWireType": function(destructors, value) {
                  if (!(typeof value == "string")) {
                      throwBindingError("Cannot pass non-string to C++ string type " + name)
                  }
                  var length = lengthBytesUTF(value);
                  var ptr = _malloc(4 + length + charSize);
                  HEAPU32[ptr >> 2] = length >> shift;
                  encodeString(value, ptr + 4, length + charSize);
                  if (destructors !== null) {
                      destructors.push(_free, ptr)
                  }
                  return ptr
              },
              "argPackAdvance": 8,
              "readValueFromPointer": simpleReadValueFromPointer,
              destructorFunction: function(ptr) {
                  _free(ptr)
              }
          })
      }

      function __embind_register_void(rawType, name) {
          name = readLatin1String(name);
          registerType(rawType, {
              isVoid: true,
              name: name,
              "argPackAdvance": 0,
              "fromWireType": function() {
                  return undefined
              },
              "toWireType": function(destructors, o) {
                  return undefined
              }
          })
      }

      function __emscripten_date_now() {
          return Date.now()
      }
      var nowIsMonotonic = true;

      function __emscripten_get_now_is_monotonic() {
          return nowIsMonotonic
      }

      function __emscripten_get_progname(str, len) {
          stringToUTF8(thisProgram, str, len)
      }

      function requireRegisteredType(rawType, humanName) {
          var impl = registeredTypes[rawType];
          if (undefined === impl) {
              throwBindingError(humanName + " has unknown type " + getTypeName(rawType))
          }
          return impl
      }

      function __emval_lookupTypes(argCount, argTypes) {
          var a = new Array(argCount);
          for (var i = 0; i < argCount; ++i) {
              a[i] = requireRegisteredType(HEAP32[(argTypes >> 2) + i], "parameter " + i)
          }
          return a
      }

      function __emval_call(handle, argCount, argTypes, argv) {
          handle = Emval.toValue(handle);
          var types = __emval_lookupTypes(argCount, argTypes);
          var args = new Array(argCount);
          for (var i = 0; i < argCount; ++i) {
              var type = types[i];
              args[i] = type["readValueFromPointer"](argv);
              argv += type["argPackAdvance"]
          }
          var rv = handle.apply(undefined, args);
          return Emval.toHandle(rv)
      }

      function __emval_equals(first, second) {
          first = Emval.toValue(first);
          second = Emval.toValue(second);
          return first == second
      }

      function __emval_incref(handle) {
          if (handle > 4) {
              emval_handle_array[handle].refcount += 1
          }
      }

      function __emval_take_value(type, argv) {
          type = requireRegisteredType(type, "_emval_take_value");
          var v = type["readValueFromPointer"](argv);
          return Emval.toHandle(v)
      }

      function __gmtime_js(time, tmPtr) {
          var date = new Date(HEAP32[time >> 2] * 1e3);
          HEAP32[tmPtr >> 2] = date.getUTCSeconds();
          HEAP32[tmPtr + 4 >> 2] = date.getUTCMinutes();
          HEAP32[tmPtr + 8 >> 2] = date.getUTCHours();
          HEAP32[tmPtr + 12 >> 2] = date.getUTCDate();
          HEAP32[tmPtr + 16 >> 2] = date.getUTCMonth();
          HEAP32[tmPtr + 20 >> 2] = date.getUTCFullYear() - 1900;
          HEAP32[tmPtr + 24 >> 2] = date.getUTCDay();
          var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
          var yday = (date.getTime() - start) / (1e3 * 60 * 60 * 24) | 0;
          HEAP32[tmPtr + 28 >> 2] = yday
      }

      function __mktime_js(tmPtr) {
          var date = new Date(HEAP32[tmPtr + 20 >> 2] + 1900, HEAP32[tmPtr + 16 >> 2], HEAP32[tmPtr + 12 >> 2], HEAP32[tmPtr + 8 >> 2], HEAP32[tmPtr + 4 >> 2], HEAP32[tmPtr >> 2], 0);
          var dst = HEAP32[tmPtr + 32 >> 2];
          var guessedOffset = date.getTimezoneOffset();
          var start = new Date(date.getFullYear(), 0, 1);
          var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
          var winterOffset = start.getTimezoneOffset();
          var dstOffset = Math.min(winterOffset, summerOffset);
          if (dst < 0) {
              HEAP32[tmPtr + 32 >> 2] = Number(summerOffset != winterOffset && dstOffset == guessedOffset)
          } else if (dst > 0 != (dstOffset == guessedOffset)) {
              var nonDstOffset = Math.max(winterOffset, summerOffset);
              var trueOffset = dst > 0 ? dstOffset : nonDstOffset;
              date.setTime(date.getTime() + (trueOffset - guessedOffset) * 6e4)
          }
          HEAP32[tmPtr + 24 >> 2] = date.getDay();
          var yday = (date.getTime() - start.getTime()) / (1e3 * 60 * 60 * 24) | 0;
          HEAP32[tmPtr + 28 >> 2] = yday;
          HEAP32[tmPtr >> 2] = date.getSeconds();
          HEAP32[tmPtr + 4 >> 2] = date.getMinutes();
          HEAP32[tmPtr + 8 >> 2] = date.getHours();
          HEAP32[tmPtr + 12 >> 2] = date.getDate();
          HEAP32[tmPtr + 16 >> 2] = date.getMonth();
          return date.getTime() / 1e3 | 0
      }

      function __mmap_js(addr, len, prot, flags, fd, off, allocated, builtin) {
          try {
              var info = FS.getStream(fd);
              if (!info) return -8;
              var res = FS.mmap(info, addr, len, off, prot, flags);
              var ptr = res.ptr;
              HEAP32[allocated >> 2] = res.allocated;
              return ptr
          } catch (e) {
              if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
              return -e.errno
          }
      }

      function __msync_js(addr, len, flags, fd) {
          try {
              SYSCALLS.doMsync(addr, FS.getStream(fd), len, flags, 0);
              return 0
          } catch (e) {
              if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
              return -e.errno
          }
      }

      function __munmap_js(addr, len, prot, flags, fd, offset) {
          try {
              var stream = FS.getStream(fd);
              if (stream) {
                  if (prot & 2) {
                      SYSCALLS.doMsync(addr, stream, len, flags, offset)
                  }
                  FS.munmap(stream)
              }
          } catch (e) {
              if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
              return -e.errno
          }
      }

      function _tzset_impl(timezone, daylight, tzname) {
          var currentYear = (new Date).getFullYear();
          var winter = new Date(currentYear, 0, 1);
          var summer = new Date(currentYear, 6, 1);
          var winterOffset = winter.getTimezoneOffset();
          var summerOffset = summer.getTimezoneOffset();
          var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
          HEAP32[timezone >> 2] = stdTimezoneOffset * 60;
          HEAP32[daylight >> 2] = Number(winterOffset != summerOffset);

          function extractZone(date) {
              var match = date.toTimeString().match(/\(([A-Za-z ]+)\)$/);
              return match ? match[1] : "GMT"
          }
          var winterName = extractZone(winter);
          var summerName = extractZone(summer);
          var winterNamePtr = allocateUTF8(winterName);
          var summerNamePtr = allocateUTF8(summerName);
          if (summerOffset < winterOffset) {
              HEAP32[tzname >> 2] = winterNamePtr;
              HEAP32[tzname + 4 >> 2] = summerNamePtr
          } else {
              HEAP32[tzname >> 2] = summerNamePtr;
              HEAP32[tzname + 4 >> 2] = winterNamePtr
          }
      }

      function __tzset_js(timezone, daylight, tzname) {
          if (__tzset_js.called) return;
          __tzset_js.called = true;
          _tzset_impl(timezone, daylight, tzname)
      }

      function _abort() {
          abort("")
      }

      function _emscripten_get_heap_max() {
          return 2147483648
      }
      var _emscripten_get_now;
      if (ENVIRONMENT_IS_NODE) {
          _emscripten_get_now = (() => {
              var t = process["hrtime"]();
              return t[0] * 1e3 + t[1] / 1e6
          })
      } else _emscripten_get_now = (() => performance.now());

      function emscripten_realloc_buffer(size) {
          try {
              wasmMemory.grow(size - buffer.byteLength + 65535 >>> 16);
              updateGlobalBufferAndViews(wasmMemory.buffer);
              return 1
          } catch (e) {}
      }

      function _emscripten_resize_heap(requestedSize) {
          var oldSize = HEAPU8.length;
          requestedSize = requestedSize >>> 0;
          var maxHeapSize = _emscripten_get_heap_max();
          if (requestedSize > maxHeapSize) {
              return false
          }
          let alignUp = (x, multiple) => x + (multiple - x % multiple) % multiple;
          for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
              var overGrownHeapSize = oldSize * (1 + .2 / cutDown);
              overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
              var newSize = Math.min(maxHeapSize, alignUp(Math.max(requestedSize, overGrownHeapSize), 65536));
              var replacement = emscripten_realloc_buffer(newSize);
              if (replacement) {
                  return true
              }
          }
          return false
      }
      var ENV = {};

      function getExecutableName() {
          return thisProgram || "./this.program"
      }

      function getEnvStrings() {
          if (!getEnvStrings.strings) {
              var lang = (typeof navigator == "object" && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8";
              var env = {
                  "USER": "web_user",
                  "LOGNAME": "web_user",
                  "PATH": "/",
                  "PWD": "/",
                  "HOME": "/home/web_user",
                  "LANG": lang,
                  "_": getExecutableName()
              };
              for (var x in ENV) {
                  if (ENV[x] === undefined) delete env[x];
                  else env[x] = ENV[x]
              }
              var strings = [];
              for (var x in env) {
                  strings.push(x + "=" + env[x])
              }
              getEnvStrings.strings = strings
          }
          return getEnvStrings.strings
      }

      function _environ_get(__environ, environ_buf) {
          var bufSize = 0;
          getEnvStrings().forEach(function(string, i) {
              var ptr = environ_buf + bufSize;
              HEAP32[__environ + i * 4 >> 2] = ptr;
              writeAsciiToMemory(string, ptr);
              bufSize += string.length + 1
          });
          return 0
      }

      function _environ_sizes_get(penviron_count, penviron_buf_size) {
          var strings = getEnvStrings();
          HEAP32[penviron_count >> 2] = strings.length;
          var bufSize = 0;
          strings.forEach(function(string) {
              bufSize += string.length + 1
          });
          HEAP32[penviron_buf_size >> 2] = bufSize;
          return 0
      }

      function _exit(status) {
          exit(status)
      }

      function _fd_close(fd) {
          try {
              var stream = SYSCALLS.getStreamFromFD(fd);
              FS.close(stream);
              return 0
          } catch (e) {
              if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
              return e.errno
          }
      }

      function doWritev(stream, iov, iovcnt, offset) {
          var ret = 0;
          for (var i = 0; i < iovcnt; i++) {
              var ptr = HEAPU32[iov >> 2];
              var len = HEAPU32[iov + 4 >> 2];
              iov += 8;
              var curr = FS.write(stream, HEAP8, ptr, len, offset);
              if (curr < 0) return -1;
              ret += curr
          }
          return ret
      }

      function _fd_pwrite(fd, iov, iovcnt, offset_low, offset_high, pnum) {
          try {
              var stream = SYSCALLS.getStreamFromFD(fd);
              var num = doWritev(stream, iov, iovcnt, offset_low);
              HEAP32[pnum >> 2] = num;
              return 0
          } catch (e) {
              if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
              return e.errno
          }
      }

      function doReadv(stream, iov, iovcnt, offset) {
          var ret = 0;
          for (var i = 0; i < iovcnt; i++) {
              var ptr = HEAPU32[iov >> 2];
              var len = HEAPU32[iov + 4 >> 2];
              iov += 8;
              var curr = FS.read(stream, HEAP8, ptr, len, offset);
              if (curr < 0) return -1;
              ret += curr;
              if (curr < len) break
          }
          return ret
      }

      function _fd_read(fd, iov, iovcnt, pnum) {
          try {
              var stream = SYSCALLS.getStreamFromFD(fd);
              var num = doReadv(stream, iov, iovcnt);
              HEAP32[pnum >> 2] = num;
              return 0
          } catch (e) {
              if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
              return e.errno
          }
      }

      function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
          try {
              var stream = SYSCALLS.getStreamFromFD(fd);
              var HIGH_OFFSET = 4294967296;
              var offset = offset_high * HIGH_OFFSET + (offset_low >>> 0);
              var DOUBLE_LIMIT = 9007199254740992;
              if (offset <= -DOUBLE_LIMIT || offset >= DOUBLE_LIMIT) {
                  return 61
              }
              FS.llseek(stream, offset, whence);
              tempI64 = [stream.position >>> 0, (tempDouble = stream.position, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[newOffset >> 2] = tempI64[0], HEAP32[newOffset + 4 >> 2] = tempI64[1];
              if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
              return 0
          } catch (e) {
              if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
              return e.errno
          }
      }

      function _fd_write(fd, iov, iovcnt, pnum) {
          try {
              var stream = SYSCALLS.getStreamFromFD(fd);
              var num = doWritev(stream, iov, iovcnt);
              HEAP32[pnum >> 2] = num;
              return 0
          } catch (e) {
              if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
              return e.errno
          }
      }

      function _getTempRet0() {
          return getTempRet0()
      }

      function _llvm_eh_typeid_for(type) {
          return type
      }

      function _proc_exit(code) {
          procExit(code)
      }

      function _rx_slow_hash() {
          err("missing function: rx_slow_hash");
          abort(-1)
      }

      function _setTempRet0(val) {
          setTempRet0(val)
      }

      function __isLeapYear(year) {
          return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
      }

      function __arraySum(array, index) {
          var sum = 0;
          for (var i = 0; i <= index; sum += array[i++]) {}
          return sum
      }
      var __MONTH_DAYS_LEAP = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      var __MONTH_DAYS_REGULAR = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

      function __addDays(date, days) {
          var newDate = new Date(date.getTime());
          while (days > 0) {
              var leap = __isLeapYear(newDate.getFullYear());
              var currentMonth = newDate.getMonth();
              var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
              if (days > daysInCurrentMonth - newDate.getDate()) {
                  days -= daysInCurrentMonth - newDate.getDate() + 1;
                  newDate.setDate(1);
                  if (currentMonth < 11) {
                      newDate.setMonth(currentMonth + 1)
                  } else {
                      newDate.setMonth(0);
                      newDate.setFullYear(newDate.getFullYear() + 1)
                  }
              } else {
                  newDate.setDate(newDate.getDate() + days);
                  return newDate
              }
          }
          return newDate
      }

      function _strftime(s, maxsize, format, tm) {
          var tm_zone = HEAP32[tm + 40 >> 2];
          var date = {
              tm_sec: HEAP32[tm >> 2],
              tm_min: HEAP32[tm + 4 >> 2],
              tm_hour: HEAP32[tm + 8 >> 2],
              tm_mday: HEAP32[tm + 12 >> 2],
              tm_mon: HEAP32[tm + 16 >> 2],
              tm_year: HEAP32[tm + 20 >> 2],
              tm_wday: HEAP32[tm + 24 >> 2],
              tm_yday: HEAP32[tm + 28 >> 2],
              tm_isdst: HEAP32[tm + 32 >> 2],
              tm_gmtoff: HEAP32[tm + 36 >> 2],
              tm_zone: tm_zone ? UTF8ToString(tm_zone) : ""
          };
          var pattern = UTF8ToString(format);
          var EXPANSION_RULES_1 = {
              "%c": "%a %b %d %H:%M:%S %Y",
              "%D": "%m/%d/%y",
              "%F": "%Y-%m-%d",
              "%h": "%b",
              "%r": "%I:%M:%S %p",
              "%R": "%H:%M",
              "%T": "%H:%M:%S",
              "%x": "%m/%d/%y",
              "%X": "%H:%M:%S",
              "%Ec": "%c",
              "%EC": "%C",
              "%Ex": "%m/%d/%y",
              "%EX": "%H:%M:%S",
              "%Ey": "%y",
              "%EY": "%Y",
              "%Od": "%d",
              "%Oe": "%e",
              "%OH": "%H",
              "%OI": "%I",
              "%Om": "%m",
              "%OM": "%M",
              "%OS": "%S",
              "%Ou": "%u",
              "%OU": "%U",
              "%OV": "%V",
              "%Ow": "%w",
              "%OW": "%W",
              "%Oy": "%y"
          };
          for (var rule in EXPANSION_RULES_1) {
              pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_1[rule])
          }
          var WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
          var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

          function leadingSomething(value, digits, character) {
              var str = typeof value == "number" ? value.toString() : value || "";
              while (str.length < digits) {
                  str = character[0] + str
              }
              return str
          }

          function leadingNulls(value, digits) {
              return leadingSomething(value, digits, "0")
          }

          function compareByDay(date1, date2) {
              function sgn(value) {
                  return value < 0 ? -1 : value > 0 ? 1 : 0
              }
              var compare;
              if ((compare = sgn(date1.getFullYear() - date2.getFullYear())) === 0) {
                  if ((compare = sgn(date1.getMonth() - date2.getMonth())) === 0) {
                      compare = sgn(date1.getDate() - date2.getDate())
                  }
              }
              return compare
          }

          function getFirstWeekStartDate(janFourth) {
              switch (janFourth.getDay()) {
                  case 0:
                      return new Date(janFourth.getFullYear() - 1, 11, 29);
                  case 1:
                      return janFourth;
                  case 2:
                      return new Date(janFourth.getFullYear(), 0, 3);
                  case 3:
                      return new Date(janFourth.getFullYear(), 0, 2);
                  case 4:
                      return new Date(janFourth.getFullYear(), 0, 1);
                  case 5:
                      return new Date(janFourth.getFullYear() - 1, 11, 31);
                  case 6:
                      return new Date(janFourth.getFullYear() - 1, 11, 30)
              }
          }

          function getWeekBasedYear(date) {
              var thisDate = __addDays(new Date(date.tm_year + 1900, 0, 1), date.tm_yday);
              var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
              var janFourthNextYear = new Date(thisDate.getFullYear() + 1, 0, 4);
              var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
              var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
              if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
                  if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
                      return thisDate.getFullYear() + 1
                  } else {
                      return thisDate.getFullYear()
                  }
              } else {
                  return thisDate.getFullYear() - 1
              }
          }
          var EXPANSION_RULES_2 = {
              "%a": function(date) {
                  return WEEKDAYS[date.tm_wday].substring(0, 3)
              },
              "%A": function(date) {
                  return WEEKDAYS[date.tm_wday]
              },
              "%b": function(date) {
                  return MONTHS[date.tm_mon].substring(0, 3)
              },
              "%B": function(date) {
                  return MONTHS[date.tm_mon]
              },
              "%C": function(date) {
                  var year = date.tm_year + 1900;
                  return leadingNulls(year / 100 | 0, 2)
              },
              "%d": function(date) {
                  return leadingNulls(date.tm_mday, 2)
              },
              "%e": function(date) {
                  return leadingSomething(date.tm_mday, 2, " ")
              },
              "%g": function(date) {
                  return getWeekBasedYear(date).toString().substring(2)
              },
              "%G": function(date) {
                  return getWeekBasedYear(date)
              },
              "%H": function(date) {
                  return leadingNulls(date.tm_hour, 2)
              },
              "%I": function(date) {
                  var twelveHour = date.tm_hour;
                  if (twelveHour == 0) twelveHour = 12;
                  else if (twelveHour > 12) twelveHour -= 12;
                  return leadingNulls(twelveHour, 2)
              },
              "%j": function(date) {
                  return leadingNulls(date.tm_mday + __arraySum(__isLeapYear(date.tm_year + 1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon - 1), 3)
              },
              "%m": function(date) {
                  return leadingNulls(date.tm_mon + 1, 2)
              },
              "%M": function(date) {
                  return leadingNulls(date.tm_min, 2)
              },
              "%n": function() {
                  return "\n"
              },
              "%p": function(date) {
                  if (date.tm_hour >= 0 && date.tm_hour < 12) {
                      return "AM"
                  } else {
                      return "PM"
                  }
              },
              "%S": function(date) {
                  return leadingNulls(date.tm_sec, 2)
              },
              "%t": function() {
                  return "\t"
              },
              "%u": function(date) {
                  return date.tm_wday || 7
              },
              "%U": function(date) {
                  var days = date.tm_yday + 7 - date.tm_wday;
                  return leadingNulls(Math.floor(days / 7), 2)
              },
              "%V": function(date) {
                  var val = Math.floor((date.tm_yday + 7 - (date.tm_wday + 6) % 7) / 7);
                  if ((date.tm_wday + 371 - date.tm_yday - 2) % 7 <= 2) {
                      val++
                  }
                  if (!val) {
                      val = 52;
                      var dec31 = (date.tm_wday + 7 - date.tm_yday - 1) % 7;
                      if (dec31 == 4 || dec31 == 5 && __isLeapYear(date.tm_year % 400 - 1)) {
                          val++
                      }
                  } else if (val == 53) {
                      var jan1 = (date.tm_wday + 371 - date.tm_yday) % 7;
                      if (jan1 != 4 && (jan1 != 3 || !__isLeapYear(date.tm_year))) val = 1
                  }
                  return leadingNulls(val, 2)
              },
              "%w": function(date) {
                  return date.tm_wday
              },
              "%W": function(date) {
                  var days = date.tm_yday + 7 - (date.tm_wday + 6) % 7;
                  return leadingNulls(Math.floor(days / 7), 2)
              },
              "%y": function(date) {
                  return (date.tm_year + 1900).toString().substring(2)
              },
              "%Y": function(date) {
                  return date.tm_year + 1900
              },
              "%z": function(date) {
                  var off = date.tm_gmtoff;
                  var ahead = off >= 0;
                  off = Math.abs(off) / 60;
                  off = off / 60 * 100 + off % 60;
                  return (ahead ? "+" : "-") + String("0000" + off).slice(-4)
              },
              "%Z": function(date) {
                  return date.tm_zone
              },
              "%%": function() {
                  return "%"
              }
          };
          pattern = pattern.replace(/%%/g, "\0\0");
          for (var rule in EXPANSION_RULES_2) {
              if (pattern.includes(rule)) {
                  pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_2[rule](date))
              }
          }
          pattern = pattern.replace(/\0\0/g, "%");
          var bytes = intArrayFromString(pattern, false);
          if (bytes.length > maxsize) {
              return 0
          }
          writeArrayToMemory(bytes, s);
          return bytes.length - 1
      }

      function _strftime_l(s, maxsize, format, tm) {
          return _strftime(s, maxsize, format, tm)
      }

      function _v4_generate_JIT_code() {
          err("missing function: v4_generate_JIT_code");
          abort(-1)
      }
      var FSNode = function(parent, name, mode, rdev) {
          if (!parent) {
              parent = this
          }
          this.parent = parent;
          this.mount = parent.mount;
          this.mounted = null;
          this.id = FS.nextInode++;
          this.name = name;
          this.mode = mode;
          this.node_ops = {};
          this.stream_ops = {};
          this.rdev = rdev
      };
      var readMode = 292 | 73;
      var writeMode = 146;
      Object.defineProperties(FSNode.prototype, {
          read: {
              get: function() {
                  return (this.mode & readMode) === readMode
              },
              set: function(val) {
                  val ? this.mode |= readMode : this.mode &= ~readMode
              }
          },
          write: {
              get: function() {
                  return (this.mode & writeMode) === writeMode
              },
              set: function(val) {
                  val ? this.mode |= writeMode : this.mode &= ~writeMode
              }
          },
          isFolder: {
              get: function() {
                  return FS.isDir(this.mode)
              }
          },
          isDevice: {
              get: function() {
                  return FS.isChrdev(this.mode)
              }
          }
      });
      FS.FSNode = FSNode;
      FS.staticInit();
      embind_init_charCodes();
      BindingError = Module["BindingError"] = extendError(Error, "BindingError");
      InternalError = Module["InternalError"] = extendError(Error, "InternalError");
      init_emval();
      UnboundTypeError = Module["UnboundTypeError"] = extendError(Error, "UnboundTypeError");
      var ASSERTIONS = false;

      function intArrayFromString(stringy, dontAddNull, length) {
          var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
          var u8array = new Array(len);
          var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
          if (dontAddNull) u8array.length = numBytesWritten;
          return u8array
      }

      function intArrayToString(array) {
          var ret = [];
          for (var i = 0; i < array.length; i++) {
              var chr = array[i];
              if (chr > 255) {
                  if (ASSERTIONS) {
                      assert(false, "Character code " + chr + " (" + String.fromCharCode(chr) + ")  at offset " + i + " not in 0x00-0xFF.")
                  }
                  chr &= 255
              }
              ret.push(String.fromCharCode(chr))
          }
          return ret.join("")
      }
      var asmLibraryArg = {
          "Oa": _BIO_free,
          "Qa": _BIO_new_mem_buf,
          "Ka": _CONF_modules_unload,
          "O": _CRYPTO_free,
          "Ta": _ERR_reason_error_string,
          "Pa": _PEM_read_bio,
          "Sa": _PEM_write,
          "Ha": __ZN2hw6trezor12register_allEv,
          "Ja": __ZN5boost10filesystem6detail12current_pathEPNS_6system10error_codeE,
          "Ia": __ZN5boost10filesystem6detail18create_directoriesERKNS0_4pathEPNS_6system10error_codeE,
          "Fa": __ZN5boost10filesystem6detail5spaceERKNS0_4pathEPNS_6system10error_codeE,
          "Ra": __ZN5boost10filesystem6detail6removeERKNS0_4pathEPNS_6system10error_codeE,
          "$": __ZN5boost10filesystem6detail6statusERKNS0_4pathEPNS_6system10error_codeE,
          "La": __ZN5boost10filesystem6detail9canonicalERKNS0_4pathES4_PNS_6system10error_codeE,
          "Na": __ZN5boost10filesystem6detail9copy_fileERKNS0_4pathES4_jPNS_6system10error_codeE,
          "Ga": __ZN5tools9dns_utils25load_txt_records_from_dnsERNSt3__26vectorINS1_12basic_stringIcNS1_11char_traitsIcEENS1_9allocatorIcEEEENS6_IS8_EEEERKSA_,
          "Ma": __ZNK5boost10filesystem4path11parent_pathEv,
          "Va": __ZNK5tools6Notify6notifyEPKcS2_z,
          "d": ___assert_fail,
          "c": ___cxa_allocate_exception,
          "n": ___cxa_begin_catch,
          "V": ___cxa_decrement_exception_refcount,
          "p": ___cxa_end_catch,
          "b": ___cxa_find_matching_catch_2,
          "g": ___cxa_find_matching_catch_3,
          "v": ___cxa_find_matching_catch_5,
          "Ua": ___cxa_find_matching_catch_6,
          "s": ___cxa_free_exception,
          "U": ___cxa_increment_exception_refcount,
          "aa": ___cxa_rethrow,
          "ca": ___cxa_rethrow_primary_exception,
          "e": ___cxa_throw,
          "da": ___cxa_uncaught_exceptions,
          "j": ___resumeException,
          "z": ___syscall_fcntl64,
          "pa": ___syscall_fdatasync,
          "$a": ___syscall_ftruncate64,
          "va": ___syscall_ioctl,
          "la": ___syscall_mkdirat,
          "W": ___syscall_openat,
          "ga": ___syscall_renameat,
          "oa": ___syscall_stat64,
          "ab": __embind_register_bigint,
          "xa": __embind_register_bool,
          "wa": __embind_register_emval,
          "Z": __embind_register_float,
          "u": __embind_register_function,
          "A": __embind_register_integer,
          "x": __embind_register_memory_view,
          "Y": __embind_register_std_string,
          "N": __embind_register_std_wstring,
          "ya": __embind_register_void,
          "L": __emscripten_date_now,
          "qa": __emscripten_get_now_is_monotonic,
          "ha": __emscripten_get_progname,
          "Da": __emval_call,
          "Ea": __emval_decref,
          "Ca": __emval_equals,
          "_": __emval_incref,
          "Aa": __emval_take_value,
          "ra": __gmtime_js,
          "sa": __mktime_js,
          "ia": __mmap_js,
          "ja": __msync_js,
          "ka": __munmap_js,
          "ta": __tzset_js,
          "D": _abort,
          "fa": _emscripten_get_heap_max,
          "K": _emscripten_get_now,
          "ea": _emscripten_resize_heap,
          "ma": _environ_get,
          "na": _environ_sizes_get,
          "P": _exit,
          "I": _fd_close,
          "Za": _fd_pwrite,
          "X": _fd_read,
          "_a": _fd_seek,
          "M": _fd_write,
          "a": _getTempRet0,
          "Q": invoke_diii,
          "R": invoke_fiii,
          "q": invoke_i,
          "i": invoke_ii,
          "f": invoke_iii,
          "m": invoke_iiii,
          "o": invoke_iiiii,
          "T": invoke_iiiiid,
          "C": invoke_iiiiii,
          "y": invoke_iiiiiii,
          "S": invoke_iiiiiiii,
          "H": invoke_iiiiiiiiiiii,
          "db": invoke_iiiiiiiijii,
          "eb": invoke_iiiiiijii,
          "Wa": invoke_iiiiij,
          "mb": invoke_iij,
          "Ya": invoke_j,
          "ob": invoke_ji,
          "ib": invoke_jii,
          "cb": invoke_jiii,
          "gb": invoke_jiiii,
          "l": invoke_v,
          "t": invoke_vi,
          "h": invoke_vii,
          "k": invoke_viii,
          "w": invoke_viiii,
          "G": invoke_viiiii,
          "Ba": invoke_viiiiii,
          "B": invoke_viiiiiii,
          "E": invoke_viiiiiiiiii,
          "J": invoke_viiiiiiiiiiiiiii,
          "bb": invoke_viiiji,
          "lb": invoke_viij,
          "Xa": invoke_viijii,
          "pb": invoke_viijiii,
          "nb": invoke_vij,
          "hb": invoke_viji,
          "kb": invoke_vijiii,
          "jb": invoke_vijiiii,
          "qb": js_send_binary_request,
          "rb": js_send_json_request,
          "r": _llvm_eh_typeid_for,
          "ua": _proc_exit,
          "fb": _rx_slow_hash,
          "F": _setTempRet0,
          "ba": _strftime_l,
          "za": _v4_generate_JIT_code
      };
      var asm = createWasm();
      var ___wasm_call_ctors = Module["___wasm_call_ctors"] = function() {
          return (___wasm_call_ctors = Module["___wasm_call_ctors"] = Module["asm"]["tb"]).apply(null, arguments)
      };
      var _free = Module["_free"] = function() {
          return (_free = Module["_free"] = Module["asm"]["ub"]).apply(null, arguments)
      };
      var __ZN5boost13serialization16singleton_module8get_lockEv = Module["__ZN5boost13serialization16singleton_module8get_lockEv"] = function() {
          return (__ZN5boost13serialization16singleton_module8get_lockEv = Module["__ZN5boost13serialization16singleton_module8get_lockEv"] = Module["asm"]["wb"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN5tools7wallet210pending_txEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN5tools7wallet210pending_txEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN5tools7wallet210pending_txEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN5tools7wallet210pending_txEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["xb"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote11transactionEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote11transactionEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote11transactionEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote11transactionEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["yb"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorINS_7variantIN10cryptonote8txin_genEJNS7_14txin_to_scriptENS7_18txin_to_scripthashENS7_11txin_to_keyEEEENS4_9allocatorISC_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorINS_7variantIN10cryptonote8txin_genEJNS7_14txin_to_scriptENS7_18txin_to_scripthashENS7_11txin_to_keyEEEENS4_9allocatorISC_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorINS_7variantIN10cryptonote8txin_genEJNS7_14txin_to_scriptENS7_18txin_to_scripthashENS7_11txin_to_keyEEEENS4_9allocatorISC_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorINS_7variantIN10cryptonote8txin_genEJNS7_14txin_to_scriptENS7_18txin_to_scripthashENS7_11txin_to_keyEEEENS4_9allocatorISC_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["zb"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENS_7variantIN10cryptonote8txin_genEJNS5_14txin_to_scriptENS5_18txin_to_scripthashENS5_11txin_to_keyEEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENS_7variantIN10cryptonote8txin_genEJNS5_14txin_to_scriptENS5_18txin_to_scripthashENS5_11txin_to_keyEEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENS_7variantIN10cryptonote8txin_genEJNS5_14txin_to_scriptENS5_18txin_to_scripthashENS5_11txin_to_keyEEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENS_7variantIN10cryptonote8txin_genEJNS5_14txin_to_scriptENS5_18txin_to_scripthashENS5_11txin_to_keyEEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["Ab"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote8txin_genEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote8txin_genEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote8txin_genEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote8txin_genEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["Bb"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote14txin_to_scriptEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote14txin_to_scriptEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote14txin_to_scriptEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote14txin_to_scriptEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["Cb"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN6crypto4hashEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN6crypto4hashEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN6crypto4hashEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN6crypto4hashEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["Db"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote18txin_to_scripthashEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote18txin_to_scripthashEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote18txin_to_scripthashEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote18txin_to_scripthashEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["Eb"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote15txout_to_scriptEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote15txout_to_scriptEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote15txout_to_scriptEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote15txout_to_scriptEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["Fb"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN6crypto10public_keyENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN6crypto10public_keyENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN6crypto10public_keyENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN6crypto10public_keyENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["Gb"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN6crypto10public_keyEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN6crypto10public_keyEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN6crypto10public_keyEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN6crypto10public_keyEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["Hb"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote11txin_to_keyEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote11txin_to_keyEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote11txin_to_keyEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote11txin_to_keyEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["Ib"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIyNS4_9allocatorIyEEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIyNS4_9allocatorIyEEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIyNS4_9allocatorIyEEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIyNS4_9allocatorIyEEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["Jb"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN6crypto9key_imageEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN6crypto9key_imageEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN6crypto9key_imageEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN6crypto9key_imageEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["Kb"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN10cryptonote6tx_outENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN10cryptonote6tx_outENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN10cryptonote6tx_outENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN10cryptonote6tx_outENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["Lb"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote6tx_outEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote6tx_outEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote6tx_outEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote6tx_outEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["Mb"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENS_7variantIN10cryptonote15txout_to_scriptEJNS5_19txout_to_scripthashENS5_12txout_to_keyEEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENS_7variantIN10cryptonote15txout_to_scriptEJNS5_19txout_to_scripthashENS5_12txout_to_keyEEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENS_7variantIN10cryptonote15txout_to_scriptEJNS5_19txout_to_scripthashENS5_12txout_to_keyEEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENS_7variantIN10cryptonote15txout_to_scriptEJNS5_19txout_to_scripthashENS5_12txout_to_keyEEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["Nb"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote19txout_to_scripthashEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote19txout_to_scripthashEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote19txout_to_scripthashEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote19txout_to_scripthashEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["Ob"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote12txout_to_keyEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote12txout_to_keyEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote12txout_to_keyEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote12txout_to_keyEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["Pb"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIhNS4_9allocatorIhEEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIhNS4_9allocatorIhEEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIhNS4_9allocatorIhEEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIhNS4_9allocatorIhEEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["Qb"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorINS5_IN6crypto9signatureENS4_9allocatorIS7_EEEENS8_ISA_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorINS5_IN6crypto9signatureENS4_9allocatorIS7_EEEENS8_ISA_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorINS5_IN6crypto9signatureENS4_9allocatorIS7_EEEENS8_ISA_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorINS5_IN6crypto9signatureENS4_9allocatorIS7_EEEENS8_ISA_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["Rb"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN6crypto9signatureENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN6crypto9signatureENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN6crypto9signatureENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN6crypto9signatureENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["Sb"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN6crypto9signatureEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN6crypto9signatureEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN6crypto9signatureEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN6crypto9signatureEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["Tb"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct10rctSigBaseEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct10rctSigBaseEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct10rctSigBaseEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct10rctSigBaseEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["Ub"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN3rct3keyENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN3rct3keyENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN3rct3keyENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN3rct3keyENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["Vb"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct3keyEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct3keyEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct3keyEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct3keyEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["Wb"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN3rct9ecdhTupleENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN3rct9ecdhTupleENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN3rct9ecdhTupleENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN3rct9ecdhTupleENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["Xb"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct9ecdhTupleEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct9ecdhTupleEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct9ecdhTupleEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct9ecdhTupleEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["Yb"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct14rctSigPrunableEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct14rctSigPrunableEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct14rctSigPrunableEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct14rctSigPrunableEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["Zb"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN3rct8rangeSigENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN3rct8rangeSigENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN3rct8rangeSigENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN3rct8rangeSigENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["_b"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct8rangeSigEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct8rangeSigEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct8rangeSigEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct8rangeSigEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["$b"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct7boroSigEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct7boroSigEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct7boroSigEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct7boroSigEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["ac"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN3rct11BulletproofENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN3rct11BulletproofENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN3rct11BulletproofENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN3rct11BulletproofENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["bc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct11BulletproofEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct11BulletproofEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct11BulletproofEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct11BulletproofEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["cc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN3rct5mgSigENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN3rct5mgSigENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN3rct5mgSigENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN3rct5mgSigENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["dc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct5mgSigEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct5mgSigEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct5mgSigEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct5mgSigEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["ec"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorINS5_IN3rct3keyENS4_9allocatorIS7_EEEENS8_ISA_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorINS5_IN3rct3keyENS4_9allocatorIS7_EEEENS8_ISA_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorINS5_IN3rct3keyENS4_9allocatorIS7_EEEENS8_ISA_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorINS5_IN3rct3keyENS4_9allocatorIS7_EEEENS8_ISA_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["fc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN3rct5clsagENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN3rct5clsagENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN3rct5clsagENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN3rct5clsagENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["gc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct5clsagEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct5clsagEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct5clsagEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct5clsagEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["hc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote20tx_destination_entryEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote20tx_destination_entryEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote20tx_destination_entryEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote20tx_destination_entryEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["ic"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote22account_public_addressEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote22account_public_addressEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote22account_public_addressEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote22account_public_addressEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["jc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__24listImNS4_9allocatorImEEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__24listImNS4_9allocatorImEEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__24listImNS4_9allocatorImEEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__24listImNS4_9allocatorImEEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["kc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN4epee7mlockedIN5tools8scrubbedIN6crypto9ec_scalarEEEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN4epee7mlockedIN5tools8scrubbedIN6crypto9ec_scalarEEEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN4epee7mlockedIN5tools8scrubbedIN6crypto9ec_scalarEEEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN4epee7mlockedIN5tools8scrubbedIN6crypto9ec_scalarEEEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["lc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN10cryptonote20tx_destination_entryENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN10cryptonote20tx_destination_entryENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN10cryptonote20tx_destination_entryENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN10cryptonote20tx_destination_entryENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["mc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN5tools7wallet220tx_construction_dataEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN5tools7wallet220tx_construction_dataEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN5tools7wallet220tx_construction_dataEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN5tools7wallet220tx_construction_dataEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["nc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN10cryptonote15tx_source_entryENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN10cryptonote15tx_source_entryENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN10cryptonote15tx_source_entryENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN10cryptonote15tx_source_entryENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["oc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote15tx_source_entryEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote15tx_source_entryEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote15tx_source_entryEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN10cryptonote15tx_source_entryEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["pc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorINS4_4pairIyN3rct5ctkeyEEENS4_9allocatorIS9_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorINS4_4pairIyN3rct5ctkeyEEENS4_9allocatorIS9_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorINS4_4pairIyN3rct5ctkeyEEENS4_9allocatorIS9_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorINS4_4pairIyN3rct5ctkeyEEENS4_9allocatorIS9_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["qc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__24pairIyN3rct5ctkeyEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__24pairIyN3rct5ctkeyEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__24pairIyN3rct5ctkeyEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__24pairIyN3rct5ctkeyEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["rc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct5ctkeyEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct5ctkeyEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct5ctkeyEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct5ctkeyEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["sc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct14multisig_kLRkiEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct14multisig_kLRkiEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct14multisig_kLRkiEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct14multisig_kLRkiEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["tc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__23setIjNS4_4lessIjEENS4_9allocatorIjEEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__23setIjNS4_4lessIjEENS4_9allocatorIjEEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__23setIjNS4_4lessIjEENS4_9allocatorIjEEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__23setIjNS4_4lessIjEENS4_9allocatorIjEEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["uc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct9RCTConfigEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct9RCTConfigEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct9RCTConfigEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct9RCTConfigEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["vc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN4epee7mlockedIN5tools8scrubbedIN6crypto9ec_scalarEEEEENS4_9allocatorISD_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN4epee7mlockedIN5tools8scrubbedIN6crypto9ec_scalarEEEEENS4_9allocatorISD_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN4epee7mlockedIN5tools8scrubbedIN6crypto9ec_scalarEEEEENS4_9allocatorISD_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN4epee7mlockedIN5tools8scrubbedIN6crypto9ec_scalarEEEEENS4_9allocatorISD_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["wc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorImNS4_9allocatorImEEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorImNS4_9allocatorImEEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorImNS4_9allocatorImEEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorImNS4_9allocatorImEEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["xc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN5tools7wallet212multisig_sigENS4_9allocatorIS8_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN5tools7wallet212multisig_sigENS4_9allocatorIS8_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN5tools7wallet212multisig_sigENS4_9allocatorIS8_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__26vectorIN5tools7wallet212multisig_sigENS4_9allocatorIS8_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["yc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN5tools7wallet212multisig_sigEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN5tools7wallet212multisig_sigEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN5tools7wallet212multisig_sigEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN5tools7wallet212multisig_sigEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["zc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct6rctSigEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct6rctSigEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct6rctSigEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct6rctSigEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["Ac"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__213unordered_setIN6crypto10public_keyENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__213unordered_setIN6crypto10public_keyENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__213unordered_setIN6crypto10public_keyENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__213unordered_setIN6crypto10public_keyENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["Bc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__213unordered_setIN3rct3keyENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__213unordered_setIN3rct3keyENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__213unordered_setIN3rct3keyENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveENSt3__213unordered_setIN3rct3keyENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorIS7_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["Cc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct12multisig_outEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct12multisig_outEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = function() {
          return (__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct12multisig_outEE16save_object_dataERNS1_14basic_oarchiveEPKv = Module["__ZNK5boost7archive6detail11oserializerINS0_24portable_binary_oarchiveEN3rct12multisig_outEE16save_object_dataERNS1_14basic_oarchiveEPKv"] = Module["asm"]["Dc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet210pending_txEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet210pending_txEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet210pending_txEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet210pending_txEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Ec"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote11transactionEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote11transactionEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote11transactionEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote11transactionEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Fc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorINS_7variantIN10cryptonote8txin_genEJNS7_14txin_to_scriptENS7_18txin_to_scripthashENS7_11txin_to_keyEEEENS4_9allocatorISC_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorINS_7variantIN10cryptonote8txin_genEJNS7_14txin_to_scriptENS7_18txin_to_scripthashENS7_11txin_to_keyEEEENS4_9allocatorISC_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorINS_7variantIN10cryptonote8txin_genEJNS7_14txin_to_scriptENS7_18txin_to_scripthashENS7_11txin_to_keyEEEENS4_9allocatorISC_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorINS_7variantIN10cryptonote8txin_genEJNS7_14txin_to_scriptENS7_18txin_to_scripthashENS7_11txin_to_keyEEEENS4_9allocatorISC_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Gc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENS_7variantIN10cryptonote8txin_genEJNS5_14txin_to_scriptENS5_18txin_to_scripthashENS5_11txin_to_keyEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENS_7variantIN10cryptonote8txin_genEJNS5_14txin_to_scriptENS5_18txin_to_scripthashENS5_11txin_to_keyEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENS_7variantIN10cryptonote8txin_genEJNS5_14txin_to_scriptENS5_18txin_to_scripthashENS5_11txin_to_keyEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENS_7variantIN10cryptonote8txin_genEJNS5_14txin_to_scriptENS5_18txin_to_scripthashENS5_11txin_to_keyEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Hc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote8txin_genEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote8txin_genEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote8txin_genEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote8txin_genEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Ic"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote14txin_to_scriptEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote14txin_to_scriptEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote14txin_to_scriptEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote14txin_to_scriptEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Jc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN6crypto4hashEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN6crypto4hashEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN6crypto4hashEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN6crypto4hashEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Kc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote18txin_to_scripthashEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote18txin_to_scripthashEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote18txin_to_scripthashEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote18txin_to_scripthashEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Lc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote15txout_to_scriptEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote15txout_to_scriptEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote15txout_to_scriptEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote15txout_to_scriptEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Mc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN6crypto10public_keyENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN6crypto10public_keyENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN6crypto10public_keyENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN6crypto10public_keyENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Nc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN6crypto10public_keyEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN6crypto10public_keyEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN6crypto10public_keyEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN6crypto10public_keyEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Oc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote11txin_to_keyEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote11txin_to_keyEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote11txin_to_keyEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote11txin_to_keyEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Pc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIyNS4_9allocatorIyEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIyNS4_9allocatorIyEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIyNS4_9allocatorIyEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIyNS4_9allocatorIyEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Qc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN6crypto9key_imageEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN6crypto9key_imageEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN6crypto9key_imageEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN6crypto9key_imageEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Rc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN10cryptonote6tx_outENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN10cryptonote6tx_outENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN10cryptonote6tx_outENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN10cryptonote6tx_outENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Sc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote6tx_outEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote6tx_outEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote6tx_outEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote6tx_outEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Tc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENS_7variantIN10cryptonote15txout_to_scriptEJNS5_19txout_to_scripthashENS5_12txout_to_keyEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENS_7variantIN10cryptonote15txout_to_scriptEJNS5_19txout_to_scripthashENS5_12txout_to_keyEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENS_7variantIN10cryptonote15txout_to_scriptEJNS5_19txout_to_scripthashENS5_12txout_to_keyEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENS_7variantIN10cryptonote15txout_to_scriptEJNS5_19txout_to_scripthashENS5_12txout_to_keyEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Uc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote19txout_to_scripthashEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote19txout_to_scripthashEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote19txout_to_scripthashEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote19txout_to_scripthashEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Vc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote12txout_to_keyEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote12txout_to_keyEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote12txout_to_keyEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote12txout_to_keyEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Wc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIhNS4_9allocatorIhEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIhNS4_9allocatorIhEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIhNS4_9allocatorIhEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIhNS4_9allocatorIhEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Xc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorINS5_IN6crypto9signatureENS4_9allocatorIS7_EEEENS8_ISA_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorINS5_IN6crypto9signatureENS4_9allocatorIS7_EEEENS8_ISA_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorINS5_IN6crypto9signatureENS4_9allocatorIS7_EEEENS8_ISA_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorINS5_IN6crypto9signatureENS4_9allocatorIS7_EEEENS8_ISA_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Yc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN6crypto9signatureENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN6crypto9signatureENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN6crypto9signatureENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN6crypto9signatureENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Zc"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN6crypto9signatureEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN6crypto9signatureEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN6crypto9signatureEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN6crypto9signatureEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["_c"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct10rctSigBaseEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct10rctSigBaseEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct10rctSigBaseEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct10rctSigBaseEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["$c"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN3rct3keyENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN3rct3keyENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN3rct3keyENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN3rct3keyENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["ad"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct3keyEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct3keyEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct3keyEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct3keyEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["bd"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN3rct9ecdhTupleENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN3rct9ecdhTupleENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN3rct9ecdhTupleENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN3rct9ecdhTupleENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["cd"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct9ecdhTupleEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct9ecdhTupleEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct9ecdhTupleEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct9ecdhTupleEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["dd"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct14rctSigPrunableEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct14rctSigPrunableEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct14rctSigPrunableEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct14rctSigPrunableEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["ed"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN3rct8rangeSigENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN3rct8rangeSigENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN3rct8rangeSigENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN3rct8rangeSigENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["fd"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct8rangeSigEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct8rangeSigEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct8rangeSigEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct8rangeSigEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["gd"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct7boroSigEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct7boroSigEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct7boroSigEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct7boroSigEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["hd"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN3rct11BulletproofENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN3rct11BulletproofENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN3rct11BulletproofENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN3rct11BulletproofENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["id"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct11BulletproofEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct11BulletproofEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct11BulletproofEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct11BulletproofEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["jd"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN3rct5mgSigENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN3rct5mgSigENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN3rct5mgSigENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN3rct5mgSigENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["kd"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct5mgSigEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct5mgSigEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct5mgSigEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct5mgSigEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["ld"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorINS5_IN3rct3keyENS4_9allocatorIS7_EEEENS8_ISA_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorINS5_IN3rct3keyENS4_9allocatorIS7_EEEENS8_ISA_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorINS5_IN3rct3keyENS4_9allocatorIS7_EEEENS8_ISA_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorINS5_IN3rct3keyENS4_9allocatorIS7_EEEENS8_ISA_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["md"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN3rct5clsagENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN3rct5clsagENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN3rct5clsagENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN3rct5clsagENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["nd"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct5clsagEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct5clsagEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct5clsagEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct5clsagEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["od"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote20tx_destination_entryEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote20tx_destination_entryEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote20tx_destination_entryEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote20tx_destination_entryEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["pd"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote22account_public_addressEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote22account_public_addressEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote22account_public_addressEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote22account_public_addressEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["qd"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__24listImNS4_9allocatorImEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__24listImNS4_9allocatorImEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__24listImNS4_9allocatorImEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__24listImNS4_9allocatorImEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["rd"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN4epee7mlockedIN5tools8scrubbedIN6crypto9ec_scalarEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN4epee7mlockedIN5tools8scrubbedIN6crypto9ec_scalarEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN4epee7mlockedIN5tools8scrubbedIN6crypto9ec_scalarEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN4epee7mlockedIN5tools8scrubbedIN6crypto9ec_scalarEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["sd"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN10cryptonote20tx_destination_entryENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN10cryptonote20tx_destination_entryENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN10cryptonote20tx_destination_entryENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN10cryptonote20tx_destination_entryENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["td"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet220tx_construction_dataEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet220tx_construction_dataEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet220tx_construction_dataEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet220tx_construction_dataEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["ud"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN10cryptonote15tx_source_entryENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN10cryptonote15tx_source_entryENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN10cryptonote15tx_source_entryENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN10cryptonote15tx_source_entryENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["vd"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote15tx_source_entryEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote15tx_source_entryEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote15tx_source_entryEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote15tx_source_entryEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["wd"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorINS4_4pairIyN3rct5ctkeyEEENS4_9allocatorIS9_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorINS4_4pairIyN3rct5ctkeyEEENS4_9allocatorIS9_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorINS4_4pairIyN3rct5ctkeyEEENS4_9allocatorIS9_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorINS4_4pairIyN3rct5ctkeyEEENS4_9allocatorIS9_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["xd"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__24pairIyN3rct5ctkeyEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__24pairIyN3rct5ctkeyEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__24pairIyN3rct5ctkeyEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__24pairIyN3rct5ctkeyEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["yd"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct5ctkeyEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct5ctkeyEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct5ctkeyEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct5ctkeyEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["zd"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct14multisig_kLRkiEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct14multisig_kLRkiEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct14multisig_kLRkiEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct14multisig_kLRkiEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Ad"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__23setIjNS4_4lessIjEENS4_9allocatorIjEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__23setIjNS4_4lessIjEENS4_9allocatorIjEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__23setIjNS4_4lessIjEENS4_9allocatorIjEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__23setIjNS4_4lessIjEENS4_9allocatorIjEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Bd"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct9RCTConfigEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct9RCTConfigEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct9RCTConfigEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct9RCTConfigEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Cd"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN4epee7mlockedIN5tools8scrubbedIN6crypto9ec_scalarEEEEENS4_9allocatorISD_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN4epee7mlockedIN5tools8scrubbedIN6crypto9ec_scalarEEEEENS4_9allocatorISD_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN4epee7mlockedIN5tools8scrubbedIN6crypto9ec_scalarEEEEENS4_9allocatorISD_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN4epee7mlockedIN5tools8scrubbedIN6crypto9ec_scalarEEEEENS4_9allocatorISD_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Dd"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorImNS4_9allocatorImEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorImNS4_9allocatorImEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorImNS4_9allocatorImEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorImNS4_9allocatorImEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Ed"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN5tools7wallet212multisig_sigENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN5tools7wallet212multisig_sigENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN5tools7wallet212multisig_sigENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN5tools7wallet212multisig_sigENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Fd"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet212multisig_sigEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet212multisig_sigEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet212multisig_sigEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet212multisig_sigEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Gd"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct6rctSigEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct6rctSigEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct6rctSigEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct6rctSigEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Hd"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_setIN6crypto10public_keyENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_setIN6crypto10public_keyENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_setIN6crypto10public_keyENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_setIN6crypto10public_keyENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Id"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_setIN3rct3keyENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_setIN3rct3keyENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_setIN3rct3keyENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_setIN3rct3keyENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Jd"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct12multisig_outEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct12multisig_outEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct12multisig_outEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3rct12multisig_outEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Kd"]).apply(null, arguments)
      };
      var ___errno_location = Module["___errno_location"] = function() {
          return (___errno_location = Module["___errno_location"] = Module["asm"]["Ld"]).apply(null, arguments)
      };
      var _malloc = Module["_malloc"] = function() {
          return (_malloc = Module["_malloc"] = Module["asm"]["Md"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet2EE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet2EE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet2EE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet2EE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Nd"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN6crypto4hashENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN6crypto4hashENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN6crypto4hashENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN6crypto4hashENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Od"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools9hashchainEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools9hashchainEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools9hashchainEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools9hashchainEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Pd"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__25dequeIN6crypto4hashENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__25dequeIN6crypto4hashENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__25dequeIN6crypto4hashENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__25dequeIN6crypto4hashENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Qd"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN5tools7wallet216transfer_detailsENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN5tools7wallet216transfer_detailsENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN5tools7wallet216transfer_detailsENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN5tools7wallet216transfer_detailsENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Rd"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet216transfer_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet216transfer_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet216transfer_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet216transfer_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Sd"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote18transaction_prefixEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote18transaction_prefixEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote18transaction_prefixEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote18transaction_prefixEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Td"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote16subaddress_indexEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote16subaddress_indexEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote16subaddress_indexEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN10cryptonote16subaddress_indexEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Ud"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorINS4_4pairIyN6crypto4hashEEENS4_9allocatorIS9_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorINS4_4pairIyN6crypto4hashEEENS4_9allocatorIS9_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorINS4_4pairIyN6crypto4hashEEENS4_9allocatorIS9_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorINS4_4pairIyN6crypto4hashEEENS4_9allocatorIS9_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Vd"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__24pairIyN6crypto4hashEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__24pairIyN6crypto4hashEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__24pairIyN6crypto4hashEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__24pairIyN6crypto4hashEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Wd"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto9key_imageEmNS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_mEEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto9key_imageEmNS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_mEEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto9key_imageEmNS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_mEEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto9key_imageEmNS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_mEEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Xd"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto4hashEN5tools7wallet228unconfirmed_transfer_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto4hashEN5tools7wallet228unconfirmed_transfer_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto4hashEN5tools7wallet228unconfirmed_transfer_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto4hashEN5tools7wallet228unconfirmed_transfer_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Yd"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet228unconfirmed_transfer_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet228unconfirmed_transfer_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet228unconfirmed_transfer_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet228unconfirmed_transfer_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Zd"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorINS4_4pairIN6crypto9key_imageENS5_IyNS4_9allocatorIyEEEEEENS9_ISC_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorINS4_4pairIN6crypto9key_imageENS5_IyNS4_9allocatorIyEEEEEENS9_ISC_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorINS4_4pairIN6crypto9key_imageENS5_IyNS4_9allocatorIyEEEEEENS9_ISC_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorINS4_4pairIN6crypto9key_imageENS5_IyNS4_9allocatorIyEEEEEENS9_ISC_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["_d"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__24pairIN6crypto9key_imageENS4_6vectorIyNS4_9allocatorIyEEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__24pairIN6crypto9key_imageENS4_6vectorIyNS4_9allocatorIyEEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__24pairIN6crypto9key_imageENS4_6vectorIyNS4_9allocatorIyEEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__24pairIN6crypto9key_imageENS4_6vectorIyNS4_9allocatorIyEEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["$d"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__218unordered_multimapIN6crypto4hashEN5tools7wallet215payment_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__218unordered_multimapIN6crypto4hashEN5tools7wallet215payment_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__218unordered_multimapIN6crypto4hashEN5tools7wallet215payment_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__218unordered_multimapIN6crypto4hashEN5tools7wallet215payment_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["ae"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet215payment_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet215payment_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet215payment_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet215payment_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["be"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto4hashEN4epee7mlockedIN5tools8scrubbedINS6_9ec_scalarEEEEENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SE_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto4hashEN4epee7mlockedIN5tools8scrubbedINS6_9ec_scalarEEEEENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SE_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto4hashEN4epee7mlockedIN5tools8scrubbedINS6_9ec_scalarEEEEENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SE_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto4hashEN4epee7mlockedIN5tools8scrubbedINS6_9ec_scalarEEEEENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SE_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["ce"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto4hashEN5tools7wallet226confirmed_transfer_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto4hashEN5tools7wallet226confirmed_transfer_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto4hashEN5tools7wallet226confirmed_transfer_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto4hashEN5tools7wallet226confirmed_transfer_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["de"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet226confirmed_transfer_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet226confirmed_transfer_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet226confirmed_transfer_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet226confirmed_transfer_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["ee"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto4hashENS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEENS4_4hashIS7_EENS4_8equal_toIS7_EENSB_INS4_4pairIKS7_SD_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto4hashENS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEENS4_4hashIS7_EENS4_8equal_toIS7_EENSB_INS4_4pairIKS7_SD_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto4hashENS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEENS4_4hashIS7_EENS4_8equal_toIS7_EENSB_INS4_4pairIKS7_SD_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto4hashENS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEENS4_4hashIS7_EENS4_8equal_toIS7_EENSB_INS4_4pairIKS7_SD_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["fe"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto4hashEN5tools7wallet215payment_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto4hashEN5tools7wallet215payment_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto4hashEN5tools7wallet215payment_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto4hashEN5tools7wallet215payment_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["ge"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto10public_keyEmNS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_mEEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto10public_keyEmNS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_mEEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto10public_keyEmNS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_mEEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto10public_keyEmNS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_mEEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["he"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN5tools7wallet216address_book_rowENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN5tools7wallet216address_book_rowENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN5tools7wallet216address_book_rowENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN5tools7wallet216address_book_rowENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["ie"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet216address_book_rowEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet216address_book_rowEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet216address_book_rowEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet216address_book_rowEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["je"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN6crypto5hash8EE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN6crypto5hash8EE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN6crypto5hash8EE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN6crypto5hash8EE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["ke"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_setIN6crypto4hashENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_setIN6crypto4hashENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_setIN6crypto4hashENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_setIN6crypto4hashENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["le"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto10public_keyEN10cryptonote16subaddress_indexENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_S9_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto10public_keyEN10cryptonote16subaddress_indexENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_S9_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto10public_keyEN10cryptonote16subaddress_indexENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_S9_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto10public_keyEN10cryptonote16subaddress_indexENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_S9_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["me"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN10cryptonote16subaddress_indexEN6crypto10public_keyENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_S9_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN10cryptonote16subaddress_indexEN6crypto10public_keyENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_S9_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN10cryptonote16subaddress_indexEN6crypto10public_keyENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_S9_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN10cryptonote16subaddress_indexEN6crypto10public_keyENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_S9_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["ne"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorINS5_INS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEENS9_ISB_EEEENS9_ISD_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorINS5_INS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEENS9_ISB_EEEENS9_ISD_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorINS5_INS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEENS9_ISB_EEEENS9_ISD_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorINS5_INS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEENS9_ISB_EEEENS9_ISD_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["oe"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorINS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEENS9_ISB_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorINS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEENS9_ISB_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorINS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEENS9_ISB_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorINS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEENS9_ISB_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["pe"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto4hashENS4_6vectorIN4epee7mlockedIN5tools8scrubbedINS6_9ec_scalarEEEEENS4_9allocatorISF_EEEENS4_4hashIS7_EENS4_8equal_toIS7_EENSG_INS4_4pairIKS7_SI_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto4hashENS4_6vectorIN4epee7mlockedIN5tools8scrubbedINS6_9ec_scalarEEEEENS4_9allocatorISF_EEEENS4_4hashIS7_EENS4_8equal_toIS7_EENSG_INS4_4pairIKS7_SI_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto4hashENS4_6vectorIN4epee7mlockedIN5tools8scrubbedINS6_9ec_scalarEEEEENS4_9allocatorISF_EEEENS4_4hashIS7_EENS4_8equal_toIS7_EENSG_INS4_4pairIKS7_SI_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto4hashENS4_6vectorIN4epee7mlockedIN5tools8scrubbedINS6_9ec_scalarEEEEENS4_9allocatorISF_EEEENS4_4hashIS7_EENS4_8equal_toIS7_EENSG_INS4_4pairIKS7_SI_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["qe"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapINS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEESB_NS4_4hashISB_EENS4_8equal_toISB_EENS9_INS4_4pairIKSB_SB_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapINS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEESB_NS4_4hashISB_EENS4_8equal_toISB_EENS9_INS4_4pairIKSB_SB_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapINS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEESB_NS4_4hashISB_EENS4_8equal_toISB_EENS9_INS4_4pairIKSB_SB_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapINS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEESB_NS4_4hashISB_EENS4_8equal_toISB_EENS9_INS4_4pairIKSB_SB_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["re"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__218unordered_multimapIN6crypto4hashEN5tools7wallet220pool_payment_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__218unordered_multimapIN6crypto4hashEN5tools7wallet220pool_payment_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__218unordered_multimapIN6crypto4hashEN5tools7wallet220pool_payment_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__218unordered_multimapIN6crypto4hashEN5tools7wallet220pool_payment_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["se"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet220pool_payment_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet220pool_payment_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet220pool_payment_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet220pool_payment_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["te"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__24pairINS4_3mapINS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEESC_NS4_4lessISC_EENSA_INS5_IKSC_SC_EEEEEENS4_6vectorISC_NSA_ISC_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__24pairINS4_3mapINS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEESC_NS4_4lessISC_EENSA_INS5_IKSC_SC_EEEEEENS4_6vectorISC_NSA_ISC_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__24pairINS4_3mapINS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEESC_NS4_4lessISC_EENSA_INS5_IKSC_SC_EEEEEENS4_6vectorISC_NSA_ISC_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__24pairINS4_3mapINS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEESC_NS4_4lessISC_EENSA_INS5_IKSC_SC_EEEEEENS4_6vectorISC_NSA_ISC_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["ue"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__23mapINS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEESB_NS4_4lessISB_EENS9_INS4_4pairIKSB_SB_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__23mapINS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEESB_NS4_4lessISB_EENS9_INS4_4pairIKSB_SB_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__23mapINS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEESB_NS4_4lessISB_EENS9_INS4_4pairIKSB_SB_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__23mapINS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEESB_NS4_4lessISB_EENS9_INS4_4pairIKSB_SB_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["ve"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__24pairIKNS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEESB_EEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__24pairIKNS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEESB_EEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__24pairIKNS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEESB_EEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__24pairIKNS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEESB_EEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["we"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto10public_keyENS6_9key_imageENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_S8_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto10public_keyENS6_9key_imageENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_S8_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto10public_keyENS6_9key_imageENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_S8_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto10public_keyENS6_9key_imageENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_S8_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["xe"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools7wallet2EE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools7wallet2EE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools7wallet2EE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools7wallet2EE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["ye"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN6crypto4hashENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN6crypto4hashENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN6crypto4hashENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN6crypto4hashENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["ze"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN6crypto4hashEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN6crypto4hashEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN6crypto4hashEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN6crypto4hashEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Ae"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools9hashchainEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools9hashchainEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools9hashchainEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools9hashchainEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Be"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__25dequeIN6crypto4hashENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__25dequeIN6crypto4hashENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__25dequeIN6crypto4hashENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__25dequeIN6crypto4hashENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Ce"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN5tools7wallet216transfer_detailsENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN5tools7wallet216transfer_detailsENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN5tools7wallet216transfer_detailsENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN5tools7wallet216transfer_detailsENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["De"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools7wallet216transfer_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools7wallet216transfer_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools7wallet216transfer_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools7wallet216transfer_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Ee"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote11transactionEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote11transactionEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote11transactionEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote11transactionEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Fe"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorINS_7variantIN10cryptonote8txin_genEJNS7_14txin_to_scriptENS7_18txin_to_scripthashENS7_11txin_to_keyEEEENS4_9allocatorISC_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorINS_7variantIN10cryptonote8txin_genEJNS7_14txin_to_scriptENS7_18txin_to_scripthashENS7_11txin_to_keyEEEENS4_9allocatorISC_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorINS_7variantIN10cryptonote8txin_genEJNS7_14txin_to_scriptENS7_18txin_to_scripthashENS7_11txin_to_keyEEEENS4_9allocatorISC_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorINS_7variantIN10cryptonote8txin_genEJNS7_14txin_to_scriptENS7_18txin_to_scripthashENS7_11txin_to_keyEEEENS4_9allocatorISC_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Ge"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENS_7variantIN10cryptonote8txin_genEJNS5_14txin_to_scriptENS5_18txin_to_scripthashENS5_11txin_to_keyEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENS_7variantIN10cryptonote8txin_genEJNS5_14txin_to_scriptENS5_18txin_to_scripthashENS5_11txin_to_keyEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENS_7variantIN10cryptonote8txin_genEJNS5_14txin_to_scriptENS5_18txin_to_scripthashENS5_11txin_to_keyEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENS_7variantIN10cryptonote8txin_genEJNS5_14txin_to_scriptENS5_18txin_to_scripthashENS5_11txin_to_keyEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["He"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote8txin_genEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote8txin_genEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote8txin_genEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote8txin_genEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Ie"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote14txin_to_scriptEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote14txin_to_scriptEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote14txin_to_scriptEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote14txin_to_scriptEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Je"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote18txin_to_scripthashEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote18txin_to_scripthashEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote18txin_to_scripthashEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote18txin_to_scripthashEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Ke"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote15txout_to_scriptEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote15txout_to_scriptEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote15txout_to_scriptEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote15txout_to_scriptEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Le"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN6crypto10public_keyENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN6crypto10public_keyENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN6crypto10public_keyENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN6crypto10public_keyENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Me"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN6crypto10public_keyEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN6crypto10public_keyEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN6crypto10public_keyEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN6crypto10public_keyEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Ne"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote11txin_to_keyEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote11txin_to_keyEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote11txin_to_keyEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote11txin_to_keyEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Oe"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIyNS4_9allocatorIyEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIyNS4_9allocatorIyEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIyNS4_9allocatorIyEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIyNS4_9allocatorIyEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Pe"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN10cryptonote6tx_outENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN10cryptonote6tx_outENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN10cryptonote6tx_outENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN10cryptonote6tx_outENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Qe"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote6tx_outEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote6tx_outEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote6tx_outEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote6tx_outEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Re"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENS_7variantIN10cryptonote15txout_to_scriptEJNS5_19txout_to_scripthashENS5_12txout_to_keyEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENS_7variantIN10cryptonote15txout_to_scriptEJNS5_19txout_to_scripthashENS5_12txout_to_keyEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENS_7variantIN10cryptonote15txout_to_scriptEJNS5_19txout_to_scripthashENS5_12txout_to_keyEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENS_7variantIN10cryptonote15txout_to_scriptEJNS5_19txout_to_scripthashENS5_12txout_to_keyEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Se"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote19txout_to_scripthashEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote19txout_to_scripthashEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote19txout_to_scripthashEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote19txout_to_scripthashEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Te"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote12txout_to_keyEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote12txout_to_keyEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote12txout_to_keyEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote12txout_to_keyEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Ue"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIhNS4_9allocatorIhEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIhNS4_9allocatorIhEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIhNS4_9allocatorIhEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIhNS4_9allocatorIhEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Ve"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorINS5_IN6crypto9signatureENS4_9allocatorIS7_EEEENS8_ISA_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorINS5_IN6crypto9signatureENS4_9allocatorIS7_EEEENS8_ISA_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorINS5_IN6crypto9signatureENS4_9allocatorIS7_EEEENS8_ISA_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorINS5_IN6crypto9signatureENS4_9allocatorIS7_EEEENS8_ISA_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["We"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN6crypto9signatureENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN6crypto9signatureENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN6crypto9signatureENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN6crypto9signatureENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Xe"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN6crypto9signatureEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN6crypto9signatureEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN6crypto9signatureEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN6crypto9signatureEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Ye"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN3rct10rctSigBaseEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN3rct10rctSigBaseEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN3rct10rctSigBaseEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN3rct10rctSigBaseEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Ze"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN3rct9ecdhTupleENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN3rct9ecdhTupleENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN3rct9ecdhTupleENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN3rct9ecdhTupleENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["_e"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN3rct9ecdhTupleEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN3rct9ecdhTupleEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN3rct9ecdhTupleEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN3rct9ecdhTupleEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["$e"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN3rct14rctSigPrunableEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN3rct14rctSigPrunableEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN3rct14rctSigPrunableEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN3rct14rctSigPrunableEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["af"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN3rct8rangeSigENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN3rct8rangeSigENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN3rct8rangeSigENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN3rct8rangeSigENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["bf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN3rct8rangeSigEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN3rct8rangeSigEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN3rct8rangeSigEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN3rct8rangeSigEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["cf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN3rct7boroSigEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN3rct7boroSigEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN3rct7boroSigEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN3rct7boroSigEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["df"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN3rct3keyEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN3rct3keyEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN3rct3keyEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN3rct3keyEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["ef"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN3rct11BulletproofENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN3rct11BulletproofENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN3rct11BulletproofENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN3rct11BulletproofENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["ff"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN3rct11BulletproofEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN3rct11BulletproofEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN3rct11BulletproofEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN3rct11BulletproofEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["gf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN3rct5mgSigENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN3rct5mgSigENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN3rct5mgSigENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN3rct5mgSigENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["hf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN3rct5mgSigEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN3rct5mgSigEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN3rct5mgSigEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN3rct5mgSigEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["jf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorINS5_IN3rct3keyENS4_9allocatorIS7_EEEENS8_ISA_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorINS5_IN3rct3keyENS4_9allocatorIS7_EEEENS8_ISA_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorINS5_IN3rct3keyENS4_9allocatorIS7_EEEENS8_ISA_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorINS5_IN3rct3keyENS4_9allocatorIS7_EEEENS8_ISA_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["kf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN3rct3keyENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN3rct3keyENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN3rct3keyENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN3rct3keyENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["lf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN3rct5clsagENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN3rct5clsagENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN3rct5clsagENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN3rct5clsagENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["mf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN3rct5clsagEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN3rct5clsagEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN3rct5clsagEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN3rct5clsagEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["nf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote18transaction_prefixEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote18transaction_prefixEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote18transaction_prefixEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote18transaction_prefixEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["of"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN6crypto9key_imageEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN6crypto9key_imageEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN6crypto9key_imageEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN6crypto9key_imageEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["pf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote16subaddress_indexEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote16subaddress_indexEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote16subaddress_indexEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote16subaddress_indexEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["qf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN5tools7wallet213multisig_infoENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN5tools7wallet213multisig_infoENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN5tools7wallet213multisig_infoENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN5tools7wallet213multisig_infoENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["rf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools7wallet213multisig_infoEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools7wallet213multisig_infoEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools7wallet213multisig_infoEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools7wallet213multisig_infoEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["sf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN5tools7wallet213multisig_info2LRENS4_9allocatorIS9_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN5tools7wallet213multisig_info2LRENS4_9allocatorIS9_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN5tools7wallet213multisig_info2LRENS4_9allocatorIS9_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN5tools7wallet213multisig_info2LRENS4_9allocatorIS9_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["tf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools7wallet213multisig_info2LREE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools7wallet213multisig_info2LREE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools7wallet213multisig_info2LREE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools7wallet213multisig_info2LREE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["uf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN6crypto9key_imageENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN6crypto9key_imageENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN6crypto9key_imageENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN6crypto9key_imageENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["vf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorINS4_4pairIyN6crypto4hashEEENS4_9allocatorIS9_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorINS4_4pairIyN6crypto4hashEEENS4_9allocatorIS9_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorINS4_4pairIyN6crypto4hashEEENS4_9allocatorIS9_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorINS4_4pairIyN6crypto4hashEEENS4_9allocatorIS9_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["wf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__24pairIyN6crypto4hashEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__24pairIyN6crypto4hashEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__24pairIyN6crypto4hashEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__24pairIyN6crypto4hashEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["xf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote22account_public_addressEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote22account_public_addressEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote22account_public_addressEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote22account_public_addressEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["yf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto9key_imageEmNS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_mEEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto9key_imageEmNS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_mEEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto9key_imageEmNS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_mEEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto9key_imageEmNS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_mEEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["zf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto4hashEN5tools7wallet228unconfirmed_transfer_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto4hashEN5tools7wallet228unconfirmed_transfer_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto4hashEN5tools7wallet228unconfirmed_transfer_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto4hashEN5tools7wallet228unconfirmed_transfer_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Af"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools7wallet228unconfirmed_transfer_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools7wallet228unconfirmed_transfer_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools7wallet228unconfirmed_transfer_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools7wallet228unconfirmed_transfer_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Bf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN10cryptonote20tx_destination_entryENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN10cryptonote20tx_destination_entryENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN10cryptonote20tx_destination_entryENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN10cryptonote20tx_destination_entryENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Cf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote20tx_destination_entryEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote20tx_destination_entryEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote20tx_destination_entryEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN10cryptonote20tx_destination_entryEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Df"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__23setIjNS4_4lessIjEENS4_9allocatorIjEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__23setIjNS4_4lessIjEENS4_9allocatorIjEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__23setIjNS4_4lessIjEENS4_9allocatorIjEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__23setIjNS4_4lessIjEENS4_9allocatorIjEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Ef"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorINS4_4pairIN6crypto9key_imageENS5_IyNS4_9allocatorIyEEEEEENS9_ISC_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorINS4_4pairIN6crypto9key_imageENS5_IyNS4_9allocatorIyEEEEEENS9_ISC_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorINS4_4pairIN6crypto9key_imageENS5_IyNS4_9allocatorIyEEEEEENS9_ISC_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorINS4_4pairIN6crypto9key_imageENS5_IyNS4_9allocatorIyEEEEEENS9_ISC_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Ff"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__24pairIN6crypto9key_imageENS4_6vectorIyNS4_9allocatorIyEEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__24pairIN6crypto9key_imageENS4_6vectorIyNS4_9allocatorIyEEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__24pairIN6crypto9key_imageENS4_6vectorIyNS4_9allocatorIyEEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__24pairIN6crypto9key_imageENS4_6vectorIyNS4_9allocatorIyEEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Gf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__218unordered_multimapIN6crypto4hashEN5tools7wallet215payment_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__218unordered_multimapIN6crypto4hashEN5tools7wallet215payment_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__218unordered_multimapIN6crypto4hashEN5tools7wallet215payment_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__218unordered_multimapIN6crypto4hashEN5tools7wallet215payment_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Hf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools7wallet215payment_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools7wallet215payment_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools7wallet215payment_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools7wallet215payment_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["If"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto4hashEN4epee7mlockedIN5tools8scrubbedINS6_9ec_scalarEEEEENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SE_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto4hashEN4epee7mlockedIN5tools8scrubbedINS6_9ec_scalarEEEEENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SE_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto4hashEN4epee7mlockedIN5tools8scrubbedINS6_9ec_scalarEEEEENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SE_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto4hashEN4epee7mlockedIN5tools8scrubbedINS6_9ec_scalarEEEEENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SE_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Jf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN4epee7mlockedIN5tools8scrubbedIN6crypto9ec_scalarEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN4epee7mlockedIN5tools8scrubbedIN6crypto9ec_scalarEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN4epee7mlockedIN5tools8scrubbedIN6crypto9ec_scalarEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN4epee7mlockedIN5tools8scrubbedIN6crypto9ec_scalarEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Kf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto4hashEN5tools7wallet226confirmed_transfer_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto4hashEN5tools7wallet226confirmed_transfer_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto4hashEN5tools7wallet226confirmed_transfer_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto4hashEN5tools7wallet226confirmed_transfer_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Lf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools7wallet226confirmed_transfer_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools7wallet226confirmed_transfer_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools7wallet226confirmed_transfer_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools7wallet226confirmed_transfer_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Mf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto4hashENS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEENS4_4hashIS7_EENS4_8equal_toIS7_EENSB_INS4_4pairIKS7_SD_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto4hashENS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEENS4_4hashIS7_EENS4_8equal_toIS7_EENSB_INS4_4pairIKS7_SD_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto4hashENS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEENS4_4hashIS7_EENS4_8equal_toIS7_EENSB_INS4_4pairIKS7_SD_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto4hashENS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEENS4_4hashIS7_EENS4_8equal_toIS7_EENSB_INS4_4pairIKS7_SD_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Nf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto4hashEN5tools7wallet215payment_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto4hashEN5tools7wallet215payment_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto4hashEN5tools7wallet215payment_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto4hashEN5tools7wallet215payment_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Of"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto10public_keyEmNS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_mEEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto10public_keyEmNS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_mEEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto10public_keyEmNS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_mEEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto10public_keyEmNS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_mEEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Pf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN5tools7wallet216address_book_rowENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN5tools7wallet216address_book_rowENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN5tools7wallet216address_book_rowENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN5tools7wallet216address_book_rowENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Qf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools7wallet216address_book_rowEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools7wallet216address_book_rowEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools7wallet216address_book_rowEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools7wallet216address_book_rowEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Rf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN6crypto5hash8EE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN6crypto5hash8EE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN6crypto5hash8EE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN6crypto5hash8EE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Sf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_setIN6crypto4hashENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_setIN6crypto4hashENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_setIN6crypto4hashENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_setIN6crypto4hashENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Tf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto10public_keyEN10cryptonote16subaddress_indexENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_S9_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto10public_keyEN10cryptonote16subaddress_indexENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_S9_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto10public_keyEN10cryptonote16subaddress_indexENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_S9_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto10public_keyEN10cryptonote16subaddress_indexENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_S9_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Uf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN10cryptonote16subaddress_indexEN6crypto10public_keyENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_S9_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN10cryptonote16subaddress_indexEN6crypto10public_keyENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_S9_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN10cryptonote16subaddress_indexEN6crypto10public_keyENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_S9_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN10cryptonote16subaddress_indexEN6crypto10public_keyENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_S9_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Vf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorINS5_INS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEENS9_ISB_EEEENS9_ISD_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorINS5_INS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEENS9_ISB_EEEENS9_ISD_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorINS5_INS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEENS9_ISB_EEEENS9_ISD_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorINS5_INS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEENS9_ISB_EEEENS9_ISD_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Wf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorINS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEENS9_ISB_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorINS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEENS9_ISB_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorINS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEENS9_ISB_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorINS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEENS9_ISB_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Xf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto4hashENS4_6vectorIN4epee7mlockedIN5tools8scrubbedINS6_9ec_scalarEEEEENS4_9allocatorISF_EEEENS4_4hashIS7_EENS4_8equal_toIS7_EENSG_INS4_4pairIKS7_SI_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto4hashENS4_6vectorIN4epee7mlockedIN5tools8scrubbedINS6_9ec_scalarEEEEENS4_9allocatorISF_EEEENS4_4hashIS7_EENS4_8equal_toIS7_EENSG_INS4_4pairIKS7_SI_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto4hashENS4_6vectorIN4epee7mlockedIN5tools8scrubbedINS6_9ec_scalarEEEEENS4_9allocatorISF_EEEENS4_4hashIS7_EENS4_8equal_toIS7_EENSG_INS4_4pairIKS7_SI_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto4hashENS4_6vectorIN4epee7mlockedIN5tools8scrubbedINS6_9ec_scalarEEEEENS4_9allocatorISF_EEEENS4_4hashIS7_EENS4_8equal_toIS7_EENSG_INS4_4pairIKS7_SI_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Yf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN4epee7mlockedIN5tools8scrubbedIN6crypto9ec_scalarEEEEENS4_9allocatorISD_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN4epee7mlockedIN5tools8scrubbedIN6crypto9ec_scalarEEEEENS4_9allocatorISD_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN4epee7mlockedIN5tools8scrubbedIN6crypto9ec_scalarEEEEENS4_9allocatorISD_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__26vectorIN4epee7mlockedIN5tools8scrubbedIN6crypto9ec_scalarEEEEENS4_9allocatorISD_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Zf"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapINS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEESB_NS4_4hashISB_EENS4_8equal_toISB_EENS9_INS4_4pairIKSB_SB_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapINS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEESB_NS4_4hashISB_EENS4_8equal_toISB_EENS9_INS4_4pairIKSB_SB_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapINS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEESB_NS4_4hashISB_EENS4_8equal_toISB_EENS9_INS4_4pairIKSB_SB_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapINS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEESB_NS4_4hashISB_EENS4_8equal_toISB_EENS9_INS4_4pairIKSB_SB_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["_f"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__218unordered_multimapIN6crypto4hashEN5tools7wallet220pool_payment_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__218unordered_multimapIN6crypto4hashEN5tools7wallet220pool_payment_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__218unordered_multimapIN6crypto4hashEN5tools7wallet220pool_payment_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__218unordered_multimapIN6crypto4hashEN5tools7wallet220pool_payment_detailsENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_SA_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["$f"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools7wallet220pool_payment_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools7wallet220pool_payment_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools7wallet220pool_payment_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveEN5tools7wallet220pool_payment_detailsEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["ag"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__24pairINS4_3mapINS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEESC_NS4_4lessISC_EENSA_INS5_IKSC_SC_EEEEEENS4_6vectorISC_NSA_ISC_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__24pairINS4_3mapINS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEESC_NS4_4lessISC_EENSA_INS5_IKSC_SC_EEEEEENS4_6vectorISC_NSA_ISC_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__24pairINS4_3mapINS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEESC_NS4_4lessISC_EENSA_INS5_IKSC_SC_EEEEEENS4_6vectorISC_NSA_ISC_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__24pairINS4_3mapINS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEESC_NS4_4lessISC_EENSA_INS5_IKSC_SC_EEEEEENS4_6vectorISC_NSA_ISC_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["bg"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__23mapINS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEESB_NS4_4lessISB_EENS9_INS4_4pairIKSB_SB_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__23mapINS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEESB_NS4_4lessISB_EENS9_INS4_4pairIKSB_SB_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__23mapINS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEESB_NS4_4lessISB_EENS9_INS4_4pairIKSB_SB_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__23mapINS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEESB_NS4_4lessISB_EENS9_INS4_4pairIKSB_SB_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["cg"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__24pairIKNS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEESB_EEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__24pairIKNS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEESB_EEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__24pairIKNS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEESB_EEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__24pairIKNS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEESB_EEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["dg"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto10public_keyENS6_9key_imageENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_S8_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto10public_keyENS6_9key_imageENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_S8_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto10public_keyENS6_9key_imageENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_S8_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_15binary_iarchiveENSt3__213unordered_mapIN6crypto10public_keyENS6_9key_imageENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_S8_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["eg"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet215unsigned_tx_setEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet215unsigned_tx_setEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet215unsigned_tx_setEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet215unsigned_tx_setEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["fg"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN5tools7wallet220tx_construction_dataENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN5tools7wallet220tx_construction_dataENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN5tools7wallet220tx_construction_dataENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN5tools7wallet220tx_construction_dataENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["gg"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__24pairImNS4_6vectorIN5tools7wallet216transfer_detailsENS4_9allocatorIS9_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__24pairImNS4_6vectorIN5tools7wallet216transfer_detailsENS4_9allocatorIS9_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__24pairImNS4_6vectorIN5tools7wallet216transfer_detailsENS4_9allocatorIS9_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__24pairImNS4_6vectorIN5tools7wallet216transfer_detailsENS4_9allocatorIS9_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["hg"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet213signed_tx_setEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet213signed_tx_setEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet213signed_tx_setEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet213signed_tx_setEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["ig"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN5tools7wallet210pending_txENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN5tools7wallet210pending_txENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN5tools7wallet210pending_txENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN5tools7wallet210pending_txENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["jg"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN6crypto9key_imageENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN6crypto9key_imageENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN6crypto9key_imageENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN6crypto9key_imageENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["kg"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet215multisig_tx_setEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet215multisig_tx_setEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet215multisig_tx_setEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet215multisig_tx_setEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["lg"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN5tools7wallet219reserve_proof_entryENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN5tools7wallet219reserve_proof_entryENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN5tools7wallet219reserve_proof_entryENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN5tools7wallet219reserve_proof_entryENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["mg"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet219reserve_proof_entryEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet219reserve_proof_entryEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet219reserve_proof_entryEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet219reserve_proof_entryEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["ng"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto10public_keyENS6_9signatureENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_S8_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto10public_keyENS6_9signatureENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_S8_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto10public_keyENS6_9signatureENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_S8_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__213unordered_mapIN6crypto10public_keyENS6_9signatureENS4_4hashIS7_EENS4_8equal_toIS7_EENS4_9allocatorINS4_4pairIKS7_S8_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["og"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__24pairIyNS4_6vectorIN5tools7wallet216transfer_detailsENS4_9allocatorIS9_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__24pairIyNS4_6vectorIN5tools7wallet216transfer_detailsENS4_9allocatorIS9_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__24pairIyNS4_6vectorIN5tools7wallet216transfer_detailsENS4_9allocatorIS9_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__24pairIyNS4_6vectorIN5tools7wallet216transfer_detailsENS4_9allocatorIS9_EEEEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["pg"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN5tools7wallet213multisig_infoENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN5tools7wallet213multisig_infoENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN5tools7wallet213multisig_infoENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN5tools7wallet213multisig_infoENS4_9allocatorIS8_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["qg"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet213multisig_infoEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet213multisig_infoEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet213multisig_infoEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet213multisig_infoEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["rg"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN5tools7wallet213multisig_info2LRENS4_9allocatorIS9_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN5tools7wallet213multisig_info2LRENS4_9allocatorIS9_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN5tools7wallet213multisig_info2LRENS4_9allocatorIS9_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN5tools7wallet213multisig_info2LRENS4_9allocatorIS9_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["sg"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet213multisig_info2LREE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet213multisig_info2LREE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet213multisig_info2LREE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN5tools7wallet213multisig_info2LREE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["tg"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3mms9file_dataEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3mms9file_dataEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3mms9file_dataEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3mms9file_dataEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["ug"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN6crypto9chacha_ivEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN6crypto9chacha_ivEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN6crypto9chacha_ivEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN6crypto9chacha_ivEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["vg"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3mms13message_storeEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3mms13message_storeEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3mms13message_storeEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3mms13message_storeEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["wg"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN3mms17authorized_signerENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN3mms17authorized_signerENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN3mms17authorized_signerENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN3mms17authorized_signerENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["xg"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3mms17authorized_signerEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3mms17authorized_signerEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3mms17authorized_signerEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3mms17authorized_signerEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["yg"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN3mms7messageENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN3mms7messageENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN3mms7messageENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveENSt3__26vectorIN3mms7messageENS4_9allocatorIS7_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["zg"]).apply(null, arguments)
      };
      var __ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3mms7messageEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3mms7messageEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = function() {
          return (__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3mms7messageEE16load_object_dataERNS1_14basic_iarchiveEPvj = Module["__ZNK5boost7archive6detail11iserializerINS0_24portable_binary_iarchiveEN3mms7messageEE16load_object_dataERNS1_14basic_iarchiveEPvj"] = Module["asm"]["Ag"]).apply(null, arguments)
      };
      var ___getTypeName = Module["___getTypeName"] = function() {
          return (___getTypeName = Module["___getTypeName"] = Module["asm"]["Bg"]).apply(null, arguments)
      };
      var ___embind_register_native_and_builtin_types = Module["___embind_register_native_and_builtin_types"] = function() {
          return (___embind_register_native_and_builtin_types = Module["___embind_register_native_and_builtin_types"] = Module["asm"]["Cg"]).apply(null, arguments)
      };
      var _emscripten_builtin_memalign = Module["_emscripten_builtin_memalign"] = function() {
          return (_emscripten_builtin_memalign = Module["_emscripten_builtin_memalign"] = Module["asm"]["Dg"]).apply(null, arguments)
      };
      var _setThrew = Module["_setThrew"] = function() {
          return (_setThrew = Module["_setThrew"] = Module["asm"]["Eg"]).apply(null, arguments)
      };
      var stackSave = Module["stackSave"] = function() {
          return (stackSave = Module["stackSave"] = Module["asm"]["Fg"]).apply(null, arguments)
      };
      var stackRestore = Module["stackRestore"] = function() {
          return (stackRestore = Module["stackRestore"] = Module["asm"]["Gg"]).apply(null, arguments)
      };
      var ___cxa_can_catch = Module["___cxa_can_catch"] = function() {
          return (___cxa_can_catch = Module["___cxa_can_catch"] = Module["asm"]["Hg"]).apply(null, arguments)
      };
      var ___cxa_is_pointer_type = Module["___cxa_is_pointer_type"] = function() {
          return (___cxa_is_pointer_type = Module["___cxa_is_pointer_type"] = Module["asm"]["Ig"]).apply(null, arguments)
      };
      var dynCall_ii = Module["dynCall_ii"] = function() {
          return (dynCall_ii = Module["dynCall_ii"] = Module["asm"]["Jg"]).apply(null, arguments)
      };
      var dynCall_vi = Module["dynCall_vi"] = function() {
          return (dynCall_vi = Module["dynCall_vi"] = Module["asm"]["Kg"]).apply(null, arguments)
      };
      var dynCall_iii = Module["dynCall_iii"] = function() {
          return (dynCall_iii = Module["dynCall_iii"] = Module["asm"]["Lg"]).apply(null, arguments)
      };
      var dynCall_vii = Module["dynCall_vii"] = function() {
          return (dynCall_vii = Module["dynCall_vii"] = Module["asm"]["Mg"]).apply(null, arguments)
      };
      var dynCall_v = Module["dynCall_v"] = function() {
          return (dynCall_v = Module["dynCall_v"] = Module["asm"]["Ng"]).apply(null, arguments)
      };
      var dynCall_viiiii = Module["dynCall_viiiii"] = function() {
          return (dynCall_viiiii = Module["dynCall_viiiii"] = Module["asm"]["Og"]).apply(null, arguments)
      };
      var dynCall_iij = Module["dynCall_iij"] = function() {
          return (dynCall_iij = Module["dynCall_iij"] = Module["asm"]["Pg"]).apply(null, arguments)
      };
      var dynCall_iiiiijii = Module["dynCall_iiiiijii"] = function() {
          return (dynCall_iiiiijii = Module["dynCall_iiiiijii"] = Module["asm"]["Qg"]).apply(null, arguments)
      };
      var dynCall_iiijiii = Module["dynCall_iiijiii"] = function() {
          return (dynCall_iiijiii = Module["dynCall_iiijiii"] = Module["asm"]["Rg"]).apply(null, arguments)
      };
      var dynCall_iiiijii = Module["dynCall_iiiijii"] = function() {
          return (dynCall_iiiijii = Module["dynCall_iiiijii"] = Module["asm"]["Sg"]).apply(null, arguments)
      };
      var dynCall_ji = Module["dynCall_ji"] = function() {
          return (dynCall_ji = Module["dynCall_ji"] = Module["asm"]["Tg"]).apply(null, arguments)
      };
      var dynCall_viii = Module["dynCall_viii"] = function() {
          return (dynCall_viii = Module["dynCall_viii"] = Module["asm"]["Ug"]).apply(null, arguments)
      };
      var dynCall_iiii = Module["dynCall_iiii"] = function() {
          return (dynCall_iiii = Module["dynCall_iiii"] = Module["asm"]["Vg"]).apply(null, arguments)
      };
      var dynCall_iiiii = Module["dynCall_iiiii"] = function() {
          return (dynCall_iiiii = Module["dynCall_iiiii"] = Module["asm"]["Wg"]).apply(null, arguments)
      };
      var dynCall_viijiii = Module["dynCall_viijiii"] = function() {
          return (dynCall_viijiii = Module["dynCall_viijiii"] = Module["asm"]["Xg"]).apply(null, arguments)
      };
      var dynCall_viiii = Module["dynCall_viiii"] = function() {
          return (dynCall_viiii = Module["dynCall_viiii"] = Module["asm"]["Yg"]).apply(null, arguments)
      };
      var dynCall_vij = Module["dynCall_vij"] = function() {
          return (dynCall_vij = Module["dynCall_vij"] = Module["asm"]["Zg"]).apply(null, arguments)
      };
      var dynCall_jiiii = Module["dynCall_jiiii"] = function() {
          return (dynCall_jiiii = Module["dynCall_jiiii"] = Module["asm"]["_g"]).apply(null, arguments)
      };
      var dynCall_viij = Module["dynCall_viij"] = function() {
          return (dynCall_viij = Module["dynCall_viij"] = Module["asm"]["$g"]).apply(null, arguments)
      };
      var dynCall_viiji = Module["dynCall_viiji"] = function() {
          return (dynCall_viiji = Module["dynCall_viiji"] = Module["asm"]["ah"]).apply(null, arguments)
      };
      var dynCall_jii = Module["dynCall_jii"] = function() {
          return (dynCall_jii = Module["dynCall_jii"] = Module["asm"]["bh"]).apply(null, arguments)
      };
      var dynCall_jiii = Module["dynCall_jiii"] = function() {
          return (dynCall_jiii = Module["dynCall_jiii"] = Module["asm"]["ch"]).apply(null, arguments)
      };
      var dynCall_viiiiii = Module["dynCall_viiiiii"] = function() {
          return (dynCall_viiiiii = Module["dynCall_viiiiii"] = Module["asm"]["dh"]).apply(null, arguments)
      };
      var dynCall_viiiji = Module["dynCall_viiiji"] = function() {
          return (dynCall_viiiji = Module["dynCall_viiiji"] = Module["asm"]["eh"]).apply(null, arguments)
      };
      var dynCall_vijiiii = Module["dynCall_vijiiii"] = function() {
          return (dynCall_vijiiii = Module["dynCall_vijiiii"] = Module["asm"]["fh"]).apply(null, arguments)
      };
      var dynCall_iiiiiiiii = Module["dynCall_iiiiiiiii"] = function() {
          return (dynCall_iiiiiiiii = Module["dynCall_iiiiiiiii"] = Module["asm"]["gh"]).apply(null, arguments)
      };
      var dynCall_iiiiii = Module["dynCall_iiiiii"] = function() {
          return (dynCall_iiiiii = Module["dynCall_iiiiii"] = Module["asm"]["hh"]).apply(null, arguments)
      };
      var dynCall_vijjjdi = Module["dynCall_vijjjdi"] = function() {
          return (dynCall_vijjjdi = Module["dynCall_vijjjdi"] = Module["asm"]["ih"]).apply(null, arguments)
      };
      var dynCall_vijj = Module["dynCall_vijj"] = function() {
          return (dynCall_vijj = Module["dynCall_vijj"] = Module["asm"]["jh"]).apply(null, arguments)
      };
      var dynCall_viji = Module["dynCall_viji"] = function() {
          return (dynCall_viji = Module["dynCall_viji"] = Module["asm"]["kh"]).apply(null, arguments)
      };
      var dynCall_vijiijiij = Module["dynCall_vijiijiij"] = function() {
          return (dynCall_vijiijiij = Module["dynCall_vijiijiij"] = Module["asm"]["lh"]).apply(null, arguments)
      };
      var dynCall_vijiiji = Module["dynCall_vijiiji"] = function() {
          return (dynCall_vijiiji = Module["dynCall_vijiiji"] = Module["asm"]["mh"]).apply(null, arguments)
      };
      var dynCall_vijiijii = Module["dynCall_vijiijii"] = function() {
          return (dynCall_vijiijii = Module["dynCall_vijiijii"] = Module["asm"]["nh"]).apply(null, arguments)
      };
      var dynCall_vijii = Module["dynCall_vijii"] = function() {
          return (dynCall_vijii = Module["dynCall_vijii"] = Module["asm"]["oh"]).apply(null, arguments)
      };
      var dynCall_vijij = Module["dynCall_vijij"] = function() {
          return (dynCall_vijij = Module["dynCall_vijij"] = Module["asm"]["ph"]).apply(null, arguments)
      };
      var dynCall_viijii = Module["dynCall_viijii"] = function() {
          return (dynCall_viijii = Module["dynCall_viijii"] = Module["asm"]["qh"]).apply(null, arguments)
      };
      var dynCall_i = Module["dynCall_i"] = function() {
          return (dynCall_i = Module["dynCall_i"] = Module["asm"]["rh"]).apply(null, arguments)
      };
      var dynCall_viiiiiiii = Module["dynCall_viiiiiiii"] = function() {
          return (dynCall_viiiiiiii = Module["dynCall_viiiiiiii"] = Module["asm"]["sh"]).apply(null, arguments)
      };
      var dynCall_vijiii = Module["dynCall_vijiii"] = function() {
          return (dynCall_vijiii = Module["dynCall_vijiii"] = Module["asm"]["th"]).apply(null, arguments)
      };
      var dynCall_iiiiiii = Module["dynCall_iiiiiii"] = function() {
          return (dynCall_iiiiiii = Module["dynCall_iiiiiii"] = Module["asm"]["uh"]).apply(null, arguments)
      };
      var dynCall_viiiiiiiii = Module["dynCall_viiiiiiiii"] = function() {
          return (dynCall_viiiiiiiii = Module["dynCall_viiiiiiiii"] = Module["asm"]["vh"]).apply(null, arguments)
      };
      var dynCall_viiiiiiiiii = Module["dynCall_viiiiiiiiii"] = function() {
          return (dynCall_viiiiiiiiii = Module["dynCall_viiiiiiiiii"] = Module["asm"]["wh"]).apply(null, arguments)
      };
      var dynCall_viiiiiiiiiiii = Module["dynCall_viiiiiiiiiiii"] = function() {
          return (dynCall_viiiiiiiiiiii = Module["dynCall_viiiiiiiiiiii"] = Module["asm"]["xh"]).apply(null, arguments)
      };
      var dynCall_iiiiiiii = Module["dynCall_iiiiiiii"] = function() {
          return (dynCall_iiiiiiii = Module["dynCall_iiiiiiii"] = Module["asm"]["yh"]).apply(null, arguments)
      };
      var dynCall_viiiiiiiiiii = Module["dynCall_viiiiiiiiiii"] = function() {
          return (dynCall_viiiiiiiiiii = Module["dynCall_viiiiiiiiiii"] = Module["asm"]["zh"]).apply(null, arguments)
      };
      var dynCall_viiiiiiiiiiiii = Module["dynCall_viiiiiiiiiiiii"] = function() {
          return (dynCall_viiiiiiiiiiiii = Module["dynCall_viiiiiiiiiiiii"] = Module["asm"]["Ah"]).apply(null, arguments)
      };
      var dynCall_viiiiiii = Module["dynCall_viiiiiii"] = function() {
          return (dynCall_viiiiiii = Module["dynCall_viiiiiii"] = Module["asm"]["Bh"]).apply(null, arguments)
      };
      var dynCall_iiiiiijii = Module["dynCall_iiiiiijii"] = function() {
          return (dynCall_iiiiiijii = Module["dynCall_iiiiiijii"] = Module["asm"]["Ch"]).apply(null, arguments)
      };
      var dynCall_iiiiiiiijii = Module["dynCall_iiiiiiiijii"] = function() {
          return (dynCall_iiiiiiiijii = Module["dynCall_iiiiiiiijii"] = Module["asm"]["Dh"]).apply(null, arguments)
      };
      var dynCall_iiiij = Module["dynCall_iiiij"] = function() {
          return (dynCall_iiiij = Module["dynCall_iiiij"] = Module["asm"]["Eh"]).apply(null, arguments)
      };
      var dynCall_iiiiiiiiiiiiii = Module["dynCall_iiiiiiiiiiiiii"] = function() {
          return (dynCall_iiiiiiiiiiiiii = Module["dynCall_iiiiiiiiiiiiii"] = Module["asm"]["Fh"]).apply(null, arguments)
      };
      var dynCall_iiiiiiiiii = Module["dynCall_iiiiiiiiii"] = function() {
          return (dynCall_iiiiiiiiii = Module["dynCall_iiiiiiiiii"] = Module["asm"]["Gh"]).apply(null, arguments)
      };
      var dynCall_jiji = Module["dynCall_jiji"] = function() {
          return (dynCall_jiji = Module["dynCall_jiji"] = Module["asm"]["Hh"]).apply(null, arguments)
      };
      var dynCall_iidiiii = Module["dynCall_iidiiii"] = function() {
          return (dynCall_iidiiii = Module["dynCall_iidiiii"] = Module["asm"]["Ih"]).apply(null, arguments)
      };
      var dynCall_j = Module["dynCall_j"] = function() {
          return (dynCall_j = Module["dynCall_j"] = Module["asm"]["Jh"]).apply(null, arguments)
      };
      var dynCall_iiiiij = Module["dynCall_iiiiij"] = function() {
          return (dynCall_iiiiij = Module["dynCall_iiiiij"] = Module["asm"]["Kh"]).apply(null, arguments)
      };
      var dynCall_iiiiid = Module["dynCall_iiiiid"] = function() {
          return (dynCall_iiiiid = Module["dynCall_iiiiid"] = Module["asm"]["Lh"]).apply(null, arguments)
      };
      var dynCall_iiiiiiiiiii = Module["dynCall_iiiiiiiiiii"] = function() {
          return (dynCall_iiiiiiiiiii = Module["dynCall_iiiiiiiiiii"] = Module["asm"]["Mh"]).apply(null, arguments)
      };
      var dynCall_iiiiiiiiiiiii = Module["dynCall_iiiiiiiiiiiii"] = function() {
          return (dynCall_iiiiiiiiiiiii = Module["dynCall_iiiiiiiiiiiii"] = Module["asm"]["Nh"]).apply(null, arguments)
      };
      var dynCall_fiii = Module["dynCall_fiii"] = function() {
          return (dynCall_fiii = Module["dynCall_fiii"] = Module["asm"]["Oh"]).apply(null, arguments)
      };
      var dynCall_diii = Module["dynCall_diii"] = function() {
          return (dynCall_diii = Module["dynCall_diii"] = Module["asm"]["Ph"]).apply(null, arguments)
      };
      var dynCall_iiiiiiiiiiii = Module["dynCall_iiiiiiiiiiii"] = function() {
          return (dynCall_iiiiiiiiiiii = Module["dynCall_iiiiiiiiiiii"] = Module["asm"]["Qh"]).apply(null, arguments)
      };
      var dynCall_viiiiiiiiiiiiiii = Module["dynCall_viiiiiiiiiiiiiii"] = function() {
          return (dynCall_viiiiiiiiiiiiiii = Module["dynCall_viiiiiiiiiiiiiii"] = Module["asm"]["Rh"]).apply(null, arguments)
      };
      var dynCall_iiiiijj = Module["dynCall_iiiiijj"] = function() {
          return (dynCall_iiiiijj = Module["dynCall_iiiiijj"] = Module["asm"]["Sh"]).apply(null, arguments)
      };
      var dynCall_iiiiiijj = Module["dynCall_iiiiiijj"] = function() {
          return (dynCall_iiiiiijj = Module["dynCall_iiiiiijj"] = Module["asm"]["Th"]).apply(null, arguments)
      };
      var _asyncify_start_unwind = Module["_asyncify_start_unwind"] = function() {
          return (_asyncify_start_unwind = Module["_asyncify_start_unwind"] = Module["asm"]["Uh"]).apply(null, arguments)
      };
      var _asyncify_stop_unwind = Module["_asyncify_stop_unwind"] = function() {
          return (_asyncify_stop_unwind = Module["_asyncify_stop_unwind"] = Module["asm"]["Vh"]).apply(null, arguments)
      };
      var _asyncify_start_rewind = Module["_asyncify_start_rewind"] = function() {
          return (_asyncify_start_rewind = Module["_asyncify_start_rewind"] = Module["asm"]["Wh"]).apply(null, arguments)
      };
      var _asyncify_stop_rewind = Module["_asyncify_stop_rewind"] = function() {
          return (_asyncify_stop_rewind = Module["_asyncify_stop_rewind"] = Module["asm"]["Xh"]).apply(null, arguments)
      };

      function invoke_iiii(index, a1, a2, a3) {
          var sp = stackSave();
          try {
              return dynCall_iiii(index, a1, a2, a3)
          } catch (e) {
              stackRestore(sp);
              if (e !== e + 0) throw e;
              _setThrew(1, 0)
          }
      }

      function invoke_iii(index, a1, a2) {
          var sp = stackSave();
          try {
              return dynCall_iii(index, a1, a2)
          } catch (e) {
              stackRestore(sp);
              if (e !== e + 0) throw e;
              _setThrew(1, 0)
          }
      }

      function invoke_vii(index, a1, a2) {
          var sp = stackSave();
          try {
              dynCall_vii(index, a1, a2)
          } catch (e) {
              stackRestore(sp);
              if (e !== e + 0) throw e;
              _setThrew(1, 0)
          }
      }

      function invoke_viii(index, a1, a2, a3) {
          var sp = stackSave();
          try {
              dynCall_viii(index, a1, a2, a3)
          } catch (e) {
              stackRestore(sp);
              if (e !== e + 0) throw e;
              _setThrew(1, 0)
          }
      }

      function invoke_ii(index, a1) {
          var sp = stackSave();
          try {
              return dynCall_ii(index, a1)
          } catch (e) {
              stackRestore(sp);
              if (e !== e + 0) throw e;
              _setThrew(1, 0)
          }
      }

      function invoke_v(index) {
          var sp = stackSave();
          try {
              dynCall_v(index)
          } catch (e) {
              stackRestore(sp);
              if (e !== e + 0) throw e;
              _setThrew(1, 0)
          }
      }

      function invoke_vi(index, a1) {
          var sp = stackSave();
          try {
              dynCall_vi(index, a1)
          } catch (e) {
              stackRestore(sp);
              if (e !== e + 0) throw e;
              _setThrew(1, 0)
          }
      }

      function invoke_viiii(index, a1, a2, a3, a4) {
          var sp = stackSave();
          try {
              dynCall_viiii(index, a1, a2, a3, a4)
          } catch (e) {
              stackRestore(sp);
              if (e !== e + 0) throw e;
              _setThrew(1, 0)
          }
      }

      function invoke_viiiii(index, a1, a2, a3, a4, a5) {
          var sp = stackSave();
          try {
              dynCall_viiiii(index, a1, a2, a3, a4, a5)
          } catch (e) {
              stackRestore(sp);
              if (e !== e + 0) throw e;
              _setThrew(1, 0)
          }
      }

      function invoke_iiiii(index, a1, a2, a3, a4) {
          var sp = stackSave();
          try {
              return dynCall_iiiii(index, a1, a2, a3, a4)
          } catch (e) {
              stackRestore(sp);
              if (e !== e + 0) throw e;
              _setThrew(1, 0)
          }
      }

      function invoke_i(index) {
          var sp = stackSave();
          try {
              return dynCall_i(index)
          } catch (e) {
              stackRestore(sp);
              if (e !== e + 0) throw e;
              _setThrew(1, 0)
          }
      }

      function invoke_iiiiiii(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
              return dynCall_iiiiiii(index, a1, a2, a3, a4, a5, a6)
          } catch (e) {
              stackRestore(sp);
              if (e !== e + 0) throw e;
              _setThrew(1, 0)
          }
      }

      function invoke_iiiiii(index, a1, a2, a3, a4, a5) {
          var sp = stackSave();
          try {
              return dynCall_iiiiii(index, a1, a2, a3, a4, a5)
          } catch (e) {
              stackRestore(sp);
              if (e !== e + 0) throw e;
              _setThrew(1, 0)
          }
      }

      function invoke_viiiiii(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
              dynCall_viiiiii(index, a1, a2, a3, a4, a5, a6)
          } catch (e) {
              stackRestore(sp);
              if (e !== e + 0) throw e;
              _setThrew(1, 0)
          }
      }

      function invoke_iiiiid(index, a1, a2, a3, a4, a5) {
          var sp = stackSave();
          try {
              return dynCall_iiiiid(index, a1, a2, a3, a4, a5)
          } catch (e) {
              stackRestore(sp);
              if (e !== e + 0) throw e;
              _setThrew(1, 0)
          }
      }

      function invoke_iiiiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
          var sp = stackSave();
          try {
              return dynCall_iiiiiiii(index, a1, a2, a3, a4, a5, a6, a7)
          } catch (e) {
              stackRestore(sp);
              if (e !== e + 0) throw e;
              _setThrew(1, 0)
          }
      }

      function invoke_fiii(index, a1, a2, a3) {
          var sp = stackSave();
          try {
              return dynCall_fiii(index, a1, a2, a3)
          } catch (e) {
              stackRestore(sp);
              if (e !== e + 0) throw e;
              _setThrew(1, 0)
          }
      }

      function invoke_diii(index, a1, a2, a3) {
          var sp = stackSave();
          try {
              return dynCall_diii(index, a1, a2, a3)
          } catch (e) {
              stackRestore(sp);
              if (e !== e + 0) throw e;
              _setThrew(1, 0)
          }
      }

      function invoke_viiiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
          var sp = stackSave();
          try {
              dynCall_viiiiiii(index, a1, a2, a3, a4, a5, a6, a7)
          } catch (e) {
              stackRestore(sp);
              if (e !== e + 0) throw e;
              _setThrew(1, 0)
          }
      }

      function invoke_iiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
          var sp = stackSave();
          try {
              return dynCall_iiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11)
          } catch (e) {
              stackRestore(sp);
              if (e !== e + 0) throw e;
              _setThrew(1, 0)
          }
      }

      function invoke_viiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
          var sp = stackSave();
          try {
              dynCall_viiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10)
          } catch (e) {
              stackRestore(sp);
              if (e !== e + 0) throw e;
              _setThrew(1, 0)
          }
      }

      function invoke_viiiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15) {
          var sp = stackSave();
          try {
              dynCall_viiiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15)
          } catch (e) {
              stackRestore(sp);
              if (e !== e + 0) throw e;
              _setThrew(1, 0)
          }
      }

      function invoke_viijiii(index, a1, a2, a3, a4, a5, a6, a7) {
          var sp = stackSave();
          try {
              dynCall_viijiii(index, a1, a2, a3, a4, a5, a6, a7)
          } catch (e) {
              stackRestore(sp);
              if (e !== e + 0) throw e;
              _setThrew(1, 0)
          }
      }

      function invoke_ji(index, a1) {
          var sp = stackSave();
          try {
              return dynCall_ji(index, a1)
          } catch (e) {
              stackRestore(sp);
              if (e !== e + 0) throw e;
              _setThrew(1, 0)
          }
      }

      function invoke_vij(index, a1, a2, a3) {
          var sp = stackSave();
          try {
              dynCall_vij(index, a1, a2, a3)
          } catch (e) {
              stackRestore(sp);
              if (e !== e + 0) throw e;
              _setThrew(1, 0)
          }
      }

      function invoke_iij(index, a1, a2, a3) {
          var sp = stackSave();
          try {
              return dynCall_iij(index, a1, a2, a3)
          } catch (e) {
              stackRestore(sp);
              if (e !== e + 0) throw e;
              _setThrew(1, 0)
          }
      }

      function invoke_viij(index, a1, a2, a3, a4) {
          var sp = stackSave();
          try {
              dynCall_viij(index, a1, a2, a3, a4)
          } catch (e) {
              stackRestore(sp);
              if (e !== e + 0) throw e;
              _setThrew(1, 0)
          }
      }

      function invoke_vijiii(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
              dynCall_vijiii(index, a1, a2, a3, a4, a5, a6)
          } catch (e) {
              stackRestore(sp);
              if (e !== e + 0) throw e;
              _setThrew(1, 0)
          }
      }

      function invoke_vijiiii(index, a1, a2, a3, a4, a5, a6, a7) {
          var sp = stackSave();
          try {
              dynCall_vijiiii(index, a1, a2, a3, a4, a5, a6, a7)
          } catch (e) {
              stackRestore(sp);
              if (e !== e + 0) throw e;
              _setThrew(1, 0)
          }
      }

      function invoke_jii(index, a1, a2) {
          var sp = stackSave();
          try {
              return dynCall_jii(index, a1, a2)
          } catch (e) {
              stackRestore(sp);
              if (e !== e + 0) throw e;
              _setThrew(1, 0)
          }
      }

      function invoke_viji(index, a1, a2, a3, a4) {
          var sp = stackSave();
          try {
              dynCall_viji(index, a1, a2, a3, a4)
          } catch (e) {
              stackRestore(sp);
              if (e !== e + 0) throw e;
              _setThrew(1, 0)
          }
      }

      function invoke_jiiii(index, a1, a2, a3, a4) {
          var sp = stackSave();
          try {
              return dynCall_jiiii(index, a1, a2, a3, a4)
          } catch (e) {
              stackRestore(sp);
              if (e !== e + 0) throw e;
              _setThrew(1, 0)
          }
      }

      function invoke_iiiiiijii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          var sp = stackSave();
          try {
              return dynCall_iiiiiijii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9)
          } catch (e) {
              stackRestore(sp);
              if (e !== e + 0) throw e;
              _setThrew(1, 0)
          }
      }

      function invoke_iiiiiiiijii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
          var sp = stackSave();
          try {
              return dynCall_iiiiiiiijii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11)
          } catch (e) {
              stackRestore(sp);
              if (e !== e + 0) throw e;
              _setThrew(1, 0)
          }
      }

      function invoke_jiii(index, a1, a2, a3) {
          var sp = stackSave();
          try {
              return dynCall_jiii(index, a1, a2, a3)
          } catch (e) {
              stackRestore(sp);
              if (e !== e + 0) throw e;
              _setThrew(1, 0)
          }
      }

      function invoke_viiiji(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
              dynCall_viiiji(index, a1, a2, a3, a4, a5, a6)
          } catch (e) {
              stackRestore(sp);
              if (e !== e + 0) throw e;
              _setThrew(1, 0)
          }
      }

      function invoke_j(index) {
          var sp = stackSave();
          try {
              return dynCall_j(index)
          } catch (e) {
              stackRestore(sp);
              if (e !== e + 0) throw e;
              _setThrew(1, 0)
          }
      }

      function invoke_viijii(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
              dynCall_viijii(index, a1, a2, a3, a4, a5, a6)
          } catch (e) {
              stackRestore(sp);
              if (e !== e + 0) throw e;
              _setThrew(1, 0)
          }
      }

      function invoke_iiiiij(index, a1, a2, a3, a4, a5, a6) {
          var sp = stackSave();
          try {
              return dynCall_iiiiij(index, a1, a2, a3, a4, a5, a6)
          } catch (e) {
              stackRestore(sp);
              if (e !== e + 0) throw e;
              _setThrew(1, 0)
          }
      }
      Module["UTF8ToString"] = UTF8ToString;
      Module["stringToUTF8"] = stringToUTF8;
      Module["lengthBytesUTF8"] = lengthBytesUTF8;
      Module["addFunction"] = addFunction;
      Module["getTempRet0"] = getTempRet0;
      Module["intArrayToString"] = intArrayToString;
      var calledRun;

      function ExitStatus(status) {
          this.name = "ExitStatus";
          this.message = "Program terminated with exit(" + status + ")";
          this.status = status
      }
      dependenciesFulfilled = function runCaller() {
          if (!calledRun) run();
          if (!calledRun) dependenciesFulfilled = runCaller
      };

      function run(args) {
          args = args || arguments_;
          if (runDependencies > 0) {
              return
          }
          preRun();
          if (runDependencies > 0) {
              return
          }

          function doRun() {
              if (calledRun) return;
              calledRun = true;
              Module["calledRun"] = true;
              if (ABORT) return;
              initRuntime();
              readyPromiseResolve(Module);
              if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
              postRun()
          }
          if (Module["setStatus"]) {
              Module["setStatus"]("Running...");
              setTimeout(function() {
                  setTimeout(function() {
                      Module["setStatus"]("")
                  }, 1);
                  doRun()
              }, 1)
          } else {
              doRun()
          }
      }
      Module["run"] = run;

      function exit(status, implicit) {
          EXITSTATUS = status;
          procExit(status)
      }

      function procExit(code) {
          EXITSTATUS = code;
          if (!keepRuntimeAlive()) {
              if (Module["onExit"]) Module["onExit"](code);
              ABORT = true
          }
          quit_(code, new ExitStatus(code))
      }
      if (Module["preInit"]) {
          if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];
          while (Module["preInit"].length > 0) {
              Module["preInit"].pop()()
          }
      }
      run();

      this.handler = monero_javascript;
      return this;
    }.bind(this)());
  }
}
