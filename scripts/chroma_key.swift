import Foundation
import CoreGraphics
import ImageIO

let args = CommandLine.arguments
guard args.count >= 3 else {
  fputs("Usage: swift chroma_key.swift input.png output.png\n", stderr)
  exit(2)
}

let inputURL = URL(fileURLWithPath: args[1])
let outputURL = URL(fileURLWithPath: args[2])

guard let source = CGImageSourceCreateWithURL(inputURL as CFURL, nil),
      let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
  fputs("Could not load image: \(args[1])\n", stderr)
  exit(1)
}

let width = image.width
let height = image.height
let bytesPerPixel = 4
let bytesPerRow = width * bytesPerPixel
let colorSpace = CGColorSpaceCreateDeviceRGB()
let bitmapInfo = CGBitmapInfo.byteOrder32Big.rawValue | CGImageAlphaInfo.premultipliedLast.rawValue
var pixels = [UInt8](repeating: 0, count: height * bytesPerRow)

guard let context = CGContext(
  data: &pixels,
  width: width,
  height: height,
  bitsPerComponent: 8,
  bytesPerRow: bytesPerRow,
  space: colorSpace,
  bitmapInfo: bitmapInfo
) else {
  fputs("Could not create bitmap context\n", stderr)
  exit(1)
}

context.interpolationQuality = .none
context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))

let keyR = Double(pixels[0])
let keyG = Double(pixels[1])
let keyB = Double(pixels[2])
let transparentDistance = 42.0
let opaqueDistance = 164.0

for y in 0..<height {
  for x in 0..<width {
    let index = y * bytesPerRow + x * bytesPerPixel
    let r = Double(pixels[index])
    let g = Double(pixels[index + 1])
    let b = Double(pixels[index + 2])
    let a = Double(pixels[index + 3])
    let distance = sqrt(pow(r - keyR, 2) + pow(g - keyG, 2) + pow(b - keyB, 2))
    let magentaEdge = min(r, b) > 58 && g < 92 && abs(r - b) < 82 && min(r, b) - g > 34
    let magentaHue = r > 36 && b > 36 && r > g * 1.32 && b > g * 1.32 && abs(r - b) < 96

    if distance <= transparentDistance || magentaHue || (magentaEdge && min(r, b) > 92) {
      pixels[index + 3] = 0
      continue
    }

    if distance < opaqueDistance || magentaEdge {
      let distanceRatio = max(0, min(1, (distance - transparentDistance) / (opaqueDistance - transparentDistance)))
      let edgeRatio = magentaEdge ? max(0.18, min(1, (min(r, b) - 58) / 90)) : 1
      let ratio = min(distanceRatio, edgeRatio)
      pixels[index + 3] = UInt8(max(0, min(255, a * ratio)))
      let spill = 1 - ratio
      pixels[index] = UInt8(max(0, min(255, r - (keyR - g) * 0.22 * spill)))
      pixels[index + 2] = UInt8(max(0, min(255, b - (keyB - g) * 0.22 * spill)))
    }
  }
}

let outputData = Data(pixels)
guard let provider = CGDataProvider(data: outputData as CFData),
      let outputImage = CGImage(
        width: width,
        height: height,
        bitsPerComponent: 8,
        bitsPerPixel: 32,
        bytesPerRow: bytesPerRow,
        space: colorSpace,
        bitmapInfo: CGBitmapInfo(rawValue: bitmapInfo),
        provider: provider,
        decode: nil,
        shouldInterpolate: false,
        intent: .defaultIntent
      ),
      let destination = CGImageDestinationCreateWithURL(outputURL as CFURL, "public.png" as CFString, 1, nil) else {
  fputs("Could not create output image: \(args[2])\n", stderr)
  exit(1)
}

CGImageDestinationAddImage(destination, outputImage, nil)
guard CGImageDestinationFinalize(destination) else {
  fputs("Could not write image: \(args[2])\n", stderr)
  exit(1)
}
