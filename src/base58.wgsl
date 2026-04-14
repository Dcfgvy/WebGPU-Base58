// Implementation of Base58 Encoding in WGSL based on IETF "The Base58 Encoding Scheme" by S. Nakamoto & M. Sporny available at https://datatracker.ietf.org/doc/html/draft-msporny-base58-03
// Copyright (c) 2026 Ivan Kusliy <ipkusliywork@gmail.com>
// Licensed under the MIT License

// Supports input up to 2968 MB in size (floor((2^32 - 1) / 1.38) bytes) in big-endian byte order.
// Output is a combination of b58_bytes & result_info. Read the doc comments of result_info for details.


/**
  Bit-packed, 4 bytes of information in big-endian byte order per array element
*/
@group(0) @binding(0) var<storage, read> input: array<u32>;

/**
  IN BYTES !!!
  Max value = floor((2^32 - 1) / 1.38)
*/
@group(0) @binding(1) var<storage, read> input_size_arr: array<u32, 1>;

/**
  Minimum size of ceil(input size * 1.38).
  Must be initially filled with 0s.
  Must be runtime-sized, since dynamically sized arrays are not allowed in WGSL.

  HIGHLY INEFFICIENT because of the runtime-sized approach.
  Access to a fixed-size array variable declared in the function scope (var<function>) is WAY FASTER than access to var<storage>.
  Therefore, it is strongly recommended to modify the shader to use a fixed input size appropriate for your use case.
*/
@group(0) @binding(2) var<storage, read_write> b58_bytes: array<u32>; // TODO maybe bit-pack 5 elements per u32

/**
  {
    number of leading zeros ('1's in the beginning of Base58 encoding),
    index of the first byte in b58_bytes (the first symbol after the leading '1's in Base58 encoding)
  }
*/
@group(0) @binding(3) var<storage, read_write> result_info: array<u32, 2>;


@compute @workgroup_size(1)
fn encode() {
  let input_size: u32 = input_size_arr[0];
  let b58_size: u32 = arrayLength(&b58_bytes);

  var zero_counter: u32 = 0u;

  // Count leading zeros
  var n: u32 = 0u;
  for(var i: u32 = 0u; i < input_size; i++){
    if(extractBits(input[i / 4u], 8u * (3 - (i % 4u)), 8u) == 0){ zero_counter++; }
    else {
      n = i;
      break;
    }
  }

  // Base-256 -> Base-58 (Horner's method)
  var carry: u32 = 0u;
  for(var i: u32 = n; i < input_size; i++){
    carry = extractBits(input[i / 4u], 8u * (3 - (i % 4u)), 8u);

    for(var j: u32 = 0u; j < b58_size; j++){
      // the index is b58_size - 1 - j because we want to have the final array in big-endian, otherwise it would be little-endian
      carry += b58_bytes[b58_size - 1 - j] * 256;
      b58_bytes[b58_size - 1 - j] = carry % 58;
      carry /= 58;
    }
    // carry should be 0 here
  }

  // Determine how many digits are actually used (strip leading zeros after the transformation)
  var first_nonzero: u32 = 0u;
  while(first_nonzero < b58_size && b58_bytes[first_nonzero] == 0){
    first_nonzero++;
  }

  // Write to the result_info array
  result_info[0] = zero_counter;
  result_info[1] = first_nonzero;
}
