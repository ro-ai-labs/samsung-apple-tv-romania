        (() => {
            // ATVE-RO-COMPAT v1: original signed OTA has already been mounted above.
            const status = { prototype: "ro-v1", expectedVersion: "16.4.4.J34S139", lastEvent: "starting", events: {} };
            global.__atveRoCompatibility = status;
            const record = event => {
                status.lastEvent = event;
                status.events[event] = (status.events[event] || 0) + 1;
                if (status.events[event] === 1) {
                    try { console.info("[ATVE-RO-COMPAT v1] " + event); } catch (_) {}
                }
            };
            try {
                const crypto = require("crypto");
                const URLClass = typeof URL === "function" ? URL : require("url").URL;
                (function installRomanianCompatibility(environment) {
          const marker = "__atveRoCompatibilityV1";
          const report = event => {
            try { environment.record(event); } catch (_) { /* Diagnostics cannot affect startup. */ }
          };
          const skip = reason => { report(reason); return { installed: false, reason }; };
          let chunk;
          try {
            const manifest = environment.loadManifest();
            const known = environment.expected.manifest;
            if (!manifest || manifest.version !== known.version || manifest.buildVersion !== known.buildVersion || manifest.build !== "production") {
              return skip("skip-version");
            }
            chunk = environment.loadAppChunk();
            if (!chunk || !chunk.modules || !Array.isArray(chunk.ids) || chunk.ids.length !== 1 || chunk.ids[0] !== "9509") return skip("skip-chunk");
            if (Object.prototype.hasOwnProperty.call(chunk, marker) && chunk[marker]) { report("already-installed"); return { installed: true, reason: "already-installed" }; }
            for (const id of [17628, 96638, 61202]) {
              const factory = chunk.modules[id];
              if (typeof factory !== "function" || environment.hashText(Function.prototype.toString.call(factory)) !== environment.expected.factories[id].method_source_sha256) {
                return skip("skip-source");
              }
            }
            const bagSource = Function.prototype.toString.call(chunk.modules[17628]);
            const facadeSource = Function.prototype.toString.call(chunk.modules[96638]);
            const storesSource = Function.prototype.toString.call(chunk.modules[61202]);
            if (!bagSource.includes("T5:()=>Bag") || !bagSource.includes("async bagRequest(e)") || !bagSource.includes("getBagValue(e)") ||
                !facadeSource.includes("O:()=>l") || !facadeSource.includes("request:(e,t)=>{}") ||
                !storesSource.includes("ta.O.http.request=(e,t)=>n.request(e,t)") || !storesSource.includes("ta.O.http.request(u,c=>")) return skip("skip-anchors");
            for (const id of [17628, 96638]) {
              const descriptor = Object.getOwnPropertyDescriptor(chunk.modules, id);
              if (!descriptor || !descriptor.writable) return skip("skip-descriptor");
            }
            if (!Object.isExtensible(chunk)) return skip("skip-descriptor");
          } catch (_) { return skip("skip-environment"); }
        
          const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
          const isRomania = value => value === "ro" || value === "RO";
          function isRomanianStorefront(value) {
            if (typeof value !== "string") return false;
            const match = /^143487(?:-[0-9]+,[0-9]+)?$/.exec(value);
            // Full equality also rejects a final newline, which JavaScript's $ can match before.
            return !!match && match[0] === value;
          }
          function repairUvSearch(existing) {
            if (existing !== undefined && existing !== null && !object(existing)) return existing;
            if (existing && existing["nowplaying-enabled"] === false) return existing;
            const before = existing || {};
            if (before.routes !== undefined && before.routes !== null && !object(before.routes)) return existing;
            const needsEnabled = before["nowplaying-enabled"] === undefined;
            const needsHost = before["uts-api-base-url"] === undefined;
            const needsRoute = !before.routes || before.routes["configurations-v3-path"] === undefined;
            if (!needsEnabled && !needsHost && !needsRoute) return existing;
            const repaired = { ...before };
            if (needsEnabled) repaired["nowplaying-enabled"] = true;
            if (needsHost) repaired["uts-api-base-url"] = "https://uts-api.itunes.apple.com";
            if (needsRoute) repaired.routes = { ...(before.routes || {}), "configurations-v3-path": "/uts/v3/configurations" };
            report("ro-bag-metadata");
            return repaired;
          }
          function wrapBag(Bag) {
            const prototype = Bag && Bag.prototype;
            const getter = prototype && Object.getOwnPropertyDescriptor(prototype, "getBagValue");
            const request = prototype && Object.getOwnPropertyDescriptor(prototype, "bagRequest");
            if (!getter || !request || !getter.writable || !request.writable || typeof getter.value !== "function" || typeof request.value !== "function") {
              report("skip-bag-api"); return;
            }
            const originalGet = getter.value;
            const originalRequest = request.value;
            const wrappedGet = function (key) {
              const value = originalGet.apply(this, arguments);
              if (key !== "uvSearch") return value;
              try {
                return isRomania(originalGet.call(this, "countryCode")) ? repairUvSearch(value) : value;
              } catch (_) { return value; }
            };
            const wrappedRequest = function (storefront) {
              const result = originalRequest.apply(this, arguments);
              if (!isRomanianStorefront(storefront)) return result;
              return result.then(body => {
                if (!object(body) || !isRomania(body.countryCode)) return body;
                const uvSearch = repairUvSearch(body.uvSearch);
                return uvSearch === body.uvSearch ? body : { ...body, uvSearch };
              });
            };
            Object.defineProperty(prototype, "getBagValue", { ...getter, value: wrappedGet });
            Object.defineProperty(prototype, "bagRequest", { ...request, value: wrappedRequest });
            report("bag-hook-active");
          }
          function configurationOptions(options) {
            if (!options || options.method !== "POST" || typeof options.url !== "string") return options;
            try {
              const url = new environment.URL(options.url);
              if (url.protocol !== "https:" || url.hostname !== "uts-api.itunes.apple.com" || url.port || url.username || url.password || url.hash || url.pathname !== "/uts/v3/configurations") return options;
              const query = url.searchParams;
              if (query.getAll("sfh").length !== 1 || !isRomanianStorefront(query.get("sfh"))) return options;
              for (const pair of [["caller", "vz"], ["pfm", "vz"], ["v", "96"]]) {
                if (query.getAll(pair[0]).length !== 1 || query.get(pair[0]) !== pair[1]) return options;
              }
              if (query.getAll("mfr").length > 1) return options;
              query.set("caller", "web"); query.set("pfm", "web"); query.set("v", "100"); query.delete("mfr");
              report("ro-configuration-profile");
              return { ...options, url: url.toString() };
            } catch (_) { return options; }
          }
          function wrapHttp(facade) {
            const http = facade && facade.http;
            const descriptor = http && Object.getOwnPropertyDescriptor(http, "request");
            if (!descriptor || !descriptor.configurable || !descriptor.writable || typeof descriptor.value !== "function") {
              report("skip-http-api"); return;
            }
            let delegate = descriptor.value;
            const wrapped = function () {
              const args = Array.prototype.slice.call(arguments);
              args[0] = configurationOptions(args[0]);
              // Deliberately outside configurationOptions' catch: delegate errors propagate once.
              return delegate.apply(this, args);
            };
            Object.defineProperty(http, "request", {
              configurable: descriptor.configurable, enumerable: descriptor.enumerable,
              get() { return typeof delegate === "function" ? wrapped : delegate; },
              set(value) { if (value !== wrapped) delegate = value; }
            });
            report("http-hook-active");
          }
          const originalBagFactory = chunk.modules[17628];
          const originalHttpFactory = chunk.modules[96638];
          chunk.modules[17628] = function (module, exports, webpackRequire) {
            const result = originalBagFactory.apply(this, arguments);
            try { wrapBag(exports.T5); } catch (_) { report("skip-bag-api"); }
            return result;
          };
          chunk.modules[96638] = function (module, exports, webpackRequire) {
            const result = originalHttpFactory.apply(this, arguments);
            try { wrapHttp(exports.O); } catch (_) { report("skip-http-api"); }
            return result;
          };
          Object.defineProperty(chunk, marker, { value: true });
          report("installed");
          return { installed: true, reason: "installed" };
        })({
                    loadManifest: () => require("./manifest.json"),
                    loadAppChunk: () => require("./app"),
                    hashText: source => crypto.createHash("sha256").update(source).digest("hex"),
                    expected: {"manifest":{"version":"16.4.4.J34S139","build":"production","buildTime":"2026-09-16T21:17:18.124Z","buildVersion":"J34S139"},"factories":{"17628":{"character_start":1903297,"character_end":1909489,"utf8_byte_start":1903297,"utf8_byte_end":1909489,"method_source_sha256":"0144026a81917b299e23d848db22f196b87059a94e4dcde54d3ed022af641b18","prefix":"17628(e,t,i){\"use strict\";i.d(t,{T5:()=>Bag,uo:()=>EmptyBag,zp:()=>p});var n=i(7322),a=i(81233),r=i(11327),o=i(42049),s=i(89363),l=i(68666),d=i(34048),c=i(92687"},"61202":{"character_start":904421,"character_end":1332669,"utf8_byte_start":904421,"utf8_byte_end":1332669,"method_source_sha256":"636e139bf73f3374e08c1d2255aa18cbc42e3886868e3f1f51fc4a472fd58a3b","prefix":"61202(e,t,i){\"use strict\";let n,a,r,o,s,l,d,c,u,h,g;i.d(t,{zp:()=>oF,il:()=>oE});var p,m,f,y,v,S,w,C,b,A,T,P,x,I,L,k,R,D,E,F,M,_,O,W,B,V,U,H,z,N,G,j,Q,X,K,q,Z,Y"},"96638":{"character_start":2005513,"character_end":2007268,"utf8_byte_start":2005513,"utf8_byte_end":2007268,"method_source_sha256":"d737c19c6f77d993703f9e7048c41003a37f60bde9b8eec114ae957f26bd5f3e","prefix":"96638(e,t,i){\"use strict\";i.d(t,{O:()=>l});var n,a,r,o,s=i(81233);(r=(a=(n=o||(o={})).AllowedContent||(n.AllowedContent={})).Key||(a.Key={}))[r.musicAndPodcasts"}}},
                    URL: URLClass,
                    record: record
                });
            } catch (_) { record("skip-entrypoint"); }
        })();
