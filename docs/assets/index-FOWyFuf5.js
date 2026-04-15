var G=Object.defineProperty;var M=(i,r,t)=>r in i?G(i,r,{enumerable:!0,configurable:!0,writable:!0,value:t}):i[r]=t;var E=(i,r,t)=>M(i,typeof r!="symbol"?r+"":r,t);(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))c(n);new MutationObserver(n=>{for(const s of n)if(s.type==="childList")for(const d of s.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&c(d)}).observe(document,{childList:!0,subtree:!0});function t(n){const s={};return n.integrity&&(s.integrity=n.integrity),n.referrerPolicy&&(s.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?s.credentials="include":n.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function c(n){if(n.ep)return;n.ep=!0;const s=t(n);fetch(n.href,s)}})();const C=`// Implementation of Base58 Encoding in WGSL based on IETF "The Base58 Encoding Scheme" by S. Nakamoto & M. Sporny available at https://datatracker.ietf.org/doc/html/draft-msporny-base58-03\r
// Copyright (c) 2026 Ivan Kusliy <ipkusliywork@gmail.com>\r
// Licensed under the MIT License\r
\r
// Theoretically supports input up to 747 MB in size (floor((2^32 - 1) / 4 / 1.37) bytes) in big-endian byte order.\r
// Output is a combination of b58_bytes & result_info. Read the doc comments of result_info for details.\r
\r
\r
/**\r
  Bit-packed, 4 bytes of information in big-endian byte order per array element\r
*/\r
@group(0) @binding(0) var<storage, read> input: array<u32>;\r
\r
/**\r
  IN BYTES !!!\r
  Max value = floor((2^32 - 1) / 4 / 1.37)\r
*/\r
@group(0) @binding(1) var<storage, read> input_size_arr: array<u32, 1>;\r
\r
/**\r
  Minimum size of ceil(input size * 4 * 1.37) in bytes. Every byte in input gets 4 bytes in b58_bytes.\r
  Must be initially filled with 0s.\r
  Must be runtime-sized, since dynamically sized arrays are not allowed in WGSL.\r
\r
  HIGHLY INEFFICIENT because of the runtime-sized approach.\r
  Access to a fixed-size array variable declared in the function scope (var<function>) is WAY FASTER than access to var<storage>.\r
  Therefore, it is strongly recommended to modify the shader to use a fixed input size appropriate for your use case.\r
*/\r
@group(0) @binding(2) var<storage, read_write> b58_bytes: array<u32>; // TODO maybe bit-pack 5 elements per u32 & another group\r
\r
/**\r
  {\r
    number of leading zeros ('1's in the beginning of Base58 encoding),\r
    index of the first byte in b58_bytes (the first symbol after the leading '1's in Base58 encoding)\r
  }\r
*/\r
@group(0) @binding(3) var<storage, read_write> result_info: array<u32, 2>;\r
\r
\r
@compute @workgroup_size(1)\r
fn encode() {\r
  let input_size: u32 = input_size_arr[0];\r
  let b58_size: u32 = arrayLength(&b58_bytes);\r
\r
  var zero_counter: u32 = 0u;\r
\r
  // Count leading zeros\r
  var n: u32 = 0u;\r
  for(var i: u32 = 0u; i < input_size; i++){\r
    if(extractBits(input[i / 4u], 8u * (3 - (i % 4u)), 8u) == 0){ zero_counter++; }\r
    else {\r
      n = i;\r
      break;\r
    }\r
  }\r
\r
  // Base-256 -> Base-58 (Horner's method)\r
  var carry: u32 = 0u;\r
  for(var i: u32 = n; i < input_size; i++){\r
    carry = extractBits(input[i / 4u], 8u * (3 - (i % 4u)), 8u);\r
\r
    for(var j: u32 = 0u; j < b58_size; j++){\r
      // the index is b58_size - 1 - j because we want to have the final array in big-endian, otherwise it would be little-endian\r
      carry += b58_bytes[b58_size - 1 - j] * 256;\r
      b58_bytes[b58_size - 1 - j] = carry % 58;\r
      carry /= 58;\r
    }\r
    // carry should be 0 here\r
  }\r
\r
  // Determine how many digits are actually used (strip leading zeros after the transformation)\r
  var first_nonzero: u32 = 0u;\r
  while(first_nonzero < b58_size && b58_bytes[first_nonzero] == 0){\r
    first_nonzero++;\r
  }\r
\r
  // Write to the result_info array\r
  result_info[0] = zero_counter;\r
  result_info[1] = first_nonzero;\r
}\r
`;function R(i){if(i.length>=255)throw new TypeError("Alphabet too long");const r=new Uint8Array(256);for(let e=0;e<r.length;e++)r[e]=255;for(let e=0;e<i.length;e++){const o=i.charAt(e),u=o.charCodeAt(0);if(r[u]!==255)throw new TypeError(o+" is ambiguous");r[u]=e}const t=i.length,c=i.charAt(0),n=Math.log(t)/Math.log(256),s=Math.log(256)/Math.log(t);function d(e){if(e instanceof Uint8Array||(ArrayBuffer.isView(e)?e=new Uint8Array(e.buffer,e.byteOffset,e.byteLength):Array.isArray(e)&&(e=Uint8Array.from(e))),!(e instanceof Uint8Array))throw new TypeError("Expected Uint8Array");if(e.length===0)return"";let o=0,u=0,a=0;const l=e.length;for(;a!==l&&e[a]===0;)a++,o++;const h=(l-a)*s+1>>>0,g=new Uint8Array(h);for(;a!==l;){let w=e[a],p=0;for(let U=h-1;(w!==0||p<u)&&U!==-1;U--,p++)w+=256*g[U]>>>0,g[U]=w%t>>>0,w=w/t>>>0;if(w!==0)throw new Error("Non-zero carry");u=p,a++}let f=h-u;for(;f!==h&&g[f]===0;)f++;let m=c.repeat(o);for(;f<h;++f)m+=i.charAt(g[f]);return m}function y(e){if(typeof e!="string")throw new TypeError("Expected String");if(e.length===0)return new Uint8Array;let o=0,u=0,a=0;for(;e[o]===c;)u++,o++;const l=(e.length-o)*n+1>>>0,h=new Uint8Array(l);for(;o<e.length;){const w=e.charCodeAt(o);if(w>255)return;let p=r[w];if(p===255)return;let U=0;for(let A=l-1;(p!==0||U<a)&&A!==-1;A--,U++)p+=t*h[A]>>>0,h[A]=p%256>>>0,p=p/256>>>0;if(p!==0)throw new Error("Non-zero carry");a=U,o++}let g=l-a;for(;g!==l&&h[g]===0;)g++;const f=new Uint8Array(u+(l-g));let m=u;for(;g!==l;)f[m++]=h[g++];return f}function b(e){const o=y(e);if(o)return o;throw new Error("Non-base"+t+" character")}return{encode:d,decodeUnsafe:y,decode:b}}var O="123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";const z=R(O),x="123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";function v(i){const r="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";let t="";for(let c=0;c<i;c++)t+=r.charAt(Math.floor(Math.random()*r.length));return t}function S(i,r){const t=new TextEncoder().encode(i);return z.encode(t)===r}class L{constructor(){E(this,"device",null);E(this,"shaderCode","")}async init(){if(!navigator.gpu)throw alert("WebGPU not supported in this environment"),new Error("WebGPU not supported in this environment");const r=await navigator.gpu.requestAdapter();if(!r)throw alert("No appropriate GPUAdapter found"),new Error("No appropriate GPUAdapter found");this.device=await r.requestDevice();try{this.shaderCode=C}catch{throw new Error("Could not read base58.wgsl file. Make sure it exists in the current directory.")}}stringToU32Array(r){const c=new TextEncoder().encode(r),n=Math.ceil(c.length/4)*4,s=new Uint8Array(n);s.set(c);const d=new Uint32Array(n/4);for(let y=0;y<d.length;y++){const b=y*4;d[y]=s[b]<<24|s[b+1]<<16|s[b+2]<<8|s[b+3]}return d}async computeBase58(r){if(!this.device)throw new Error("Device not initialized. Call init() first.");const t=this.stringToU32Array(r),c=new TextEncoder().encode(r).length,n=this.device.createShaderModule({code:this.shaderCode}),s=Math.max(4,Math.ceil(c/4)*4),d=Math.max(4,Math.ceil(Math.ceil(c*4*1.37)/4)*4),y=this.device.createBuffer({size:s,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),b=this.device.createBuffer({size:4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),e=this.device.createBuffer({size:d,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC}),o=this.device.createBuffer({size:8,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC}),u=this.device.createBuffer({size:d,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),a=this.device.createBuffer({size:8,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});this.device.queue.writeBuffer(y,0,new Uint32Array(t)),this.device.queue.writeBuffer(b,0,new Uint32Array([c]));const l=this.device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:3,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}}]}),h=this.device.createBindGroup({layout:l,entries:[{binding:0,resource:{buffer:y}},{binding:1,resource:{buffer:b}},{binding:2,resource:{buffer:e}},{binding:3,resource:{buffer:o}}]}),g=this.device.createComputePipeline({layout:this.device.createPipelineLayout({bindGroupLayouts:[l]}),compute:{module:n,entryPoint:"encode"}}),f=this.device.createCommandEncoder(),m=f.beginComputePass();m.setPipeline(g),m.setBindGroup(0,h),m.dispatchWorkgroups(1),m.end(),f.copyBufferToBuffer(e,0,u,0,d),f.copyBufferToBuffer(o,0,a,0,8),this.device.queue.submit([f.finish()]),await Promise.all([u.mapAsync(GPUMapMode.READ),a.mapAsync(GPUMapMode.READ)]);const w=u.getMappedRange(),p=a.getMappedRange(),U=Array.from(new Uint32Array(w.slice(0))),A=Array.from(new Uint32Array(p.slice(0)));u.unmap(),a.unmap();const _=A[0],T=A[1];let P="1".repeat(_);for(let B=T;B<U.length;B++)P+=x[U[B]];return P}}async function I(){try{console.log("🚀 Starting Base58 Encoding Test"),console.log("================================");const i=new L;await i.init();const r=["\0\0","Hello, World!","The quick brown fox jumps over the lazy dog",v(50),v(100),"","!","Base58 encoding test with WebGPU implementation using WGSL shaders!"];console.log(`Running test cases...
`);for(let e=0;e<r.length;e++){const o=r[e],u=o.length>50?o.substring(0,47)+"...":o;console.log(`Test ${e+1}: "${u}"`),console.log(`Input length: ${o.length} characters`);try{const a=performance.now(),l=await i.computeBase58(o),h=performance.now();console.log(`WebGPU Result: ${l} (Length: ${l.length})`);const g=S(o,l),f=new TextEncoder().encode(o),m=z.encode(f);console.log(`JS Result: ${m} (Length: ${m.length})`),console.log(`✅ Verification: ${g?"PASSED":"FAILED"}`),console.log(`⏱️ Execution time: ${(h-a).toFixed(2)}ms`)}catch(a){console.error(`❌ Error: ${a}`)}console.log("─".repeat(80))}console.log(`
🏃 Performance Test with Random Large Data`),console.log("====================================");const t=v(1e3);console.log(`Testing with ${t.length} character string:
${t}`);const c=performance.now(),n=await i.computeBase58(t),s=performance.now();console.log(`WebGPU Result: ${n} (Length: ${n.length})`),console.log(`⏱️ Execution time: ${(s-c).toFixed(2)}ms`);const d=S(t,n),y=new TextEncoder().encode(t),b=z.encode(y);console.log(`JS Result: ${b} (Length: ${b.length})`),console.log(`✅ Verification: ${d?"PASSED":"FAILED"}`)}catch(i){console.error("❌ Error:",i)}}I();
