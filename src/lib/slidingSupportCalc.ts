export type SupportInputs = {
  quantity: number
  pipeDiameter: number
  baseLength: number
  baseWidth: number
  baseThickness: number
  saddleWidth: number
  saddleThickness: number
  wrapAngle: number
  ribLength: number
  ribHeight: number
  ribThickness: number
  ribsPerSupport: number
  gasketLength: number
  gasketWidth: number
  gasketThickness: number
  steelDensity: number
  gasketDensity: number
  wastePercent: number
  steelPrice: number
  gasketPrice: number
  paintPrice: number
}

export type MaterialRow = {
  name: string
  material: string
  dimensions: string
  piecesPerSupport: number
  batchPieces: number
  unitMass: number
  massPerSupport: number
  batchMass: number
  blankArea: number
}

export type SupportCalculation = {
  rows: MaterialRow[]
  netSteelMass: number
  netGasketMass: number
  netMass: number
  purchaseSteelMass: number
  purchaseGasketMass: number
  purchaseMass: number
  paintArea: number
  steelCost: number
  gasketCost: number
  paintCost: number
  totalCost: number
  costPerSupport: number
  massPerSupport: number
}

const MM3_IN_M3 = 1_000_000_000
const MM2_IN_M2 = 1_000_000

const massFromVolume = (volumeMm3: number, density: number) =>
  (volumeMm3 / MM3_IN_M3) * density

export const initialSupportInputs: SupportInputs = {
  quantity: 24,
  pipeDiameter: 159,
  baseLength: 300,
  baseWidth: 220,
  baseThickness: 10,
  saddleWidth: 120,
  saddleThickness: 8,
  wrapAngle: 120,
  ribLength: 90,
  ribHeight: 75,
  ribThickness: 8,
  ribsPerSupport: 2,
  gasketLength: 260,
  gasketWidth: 180,
  gasketThickness: 5,
  steelDensity: 7850,
  gasketDensity: 2200,
  wastePercent: 7,
  steelPrice: 92,
  gasketPrice: 780,
  paintPrice: 420,
}

export function calculateSupport(input: SupportInputs): SupportCalculation {
  const quantity = Math.max(0, input.quantity)
  const arcLength = Math.PI * input.pipeDiameter * (input.wrapAngle / 360)
  const wasteFactor = 1 + input.wastePercent / 100

  const baseVolume = input.baseLength * input.baseWidth * input.baseThickness
  const saddleVolume = arcLength * input.saddleWidth * input.saddleThickness
  const ribFaceArea = (input.ribLength * input.ribHeight) / 2
  const ribVolume = ribFaceArea * input.ribThickness
  const gasketVolume =
    input.gasketLength * input.gasketWidth * input.gasketThickness

  const baseMass = massFromVolume(baseVolume, input.steelDensity)
  const saddleMass = massFromVolume(saddleVolume, input.steelDensity)
  const ribMass = massFromVolume(ribVolume, input.steelDensity)
  const gasketMass = massFromVolume(gasketVolume, input.gasketDensity)

  const rows: MaterialRow[] = [
    {
      name: 'Основание',
      material: `Сталь, лист ${input.baseThickness} мм`,
      dimensions: `${input.baseLength} × ${input.baseWidth} × ${input.baseThickness} мм`,
      piecesPerSupport: 1,
      batchPieces: quantity,
      unitMass: baseMass,
      massPerSupport: baseMass,
      batchMass: baseMass * quantity,
      blankArea: (input.baseLength * input.baseWidth * quantity) / MM2_IN_M2,
    },
    {
      name: 'Ложемент',
      material: `Сталь, лист ${input.saddleThickness} мм`,
      dimensions: `${arcLength.toFixed(0)} × ${input.saddleWidth} × ${input.saddleThickness} мм (дуга ${input.wrapAngle}°)`,
      piecesPerSupport: 1,
      batchPieces: quantity,
      unitMass: saddleMass,
      massPerSupport: saddleMass,
      batchMass: saddleMass * quantity,
      blankArea: (arcLength * input.saddleWidth * quantity) / MM2_IN_M2,
    },
    {
      name: 'Ребро жёсткости',
      material: `Сталь, лист ${input.ribThickness} мм`,
      dimensions: `${input.ribLength} × ${input.ribHeight} × ${input.ribThickness} мм, треугольник`,
      piecesPerSupport: input.ribsPerSupport,
      batchPieces: input.ribsPerSupport * quantity,
      unitMass: ribMass,
      massPerSupport: ribMass * input.ribsPerSupport,
      batchMass: ribMass * input.ribsPerSupport * quantity,
      blankArea:
        (ribFaceArea * input.ribsPerSupport * quantity) / MM2_IN_M2,
    },
    {
      name: 'Скользящая прокладка',
      material: `Фторопласт, лист ${input.gasketThickness} мм`,
      dimensions: `${input.gasketLength} × ${input.gasketWidth} × ${input.gasketThickness} мм`,
      piecesPerSupport: 1,
      batchPieces: quantity,
      unitMass: gasketMass,
      massPerSupport: gasketMass,
      batchMass: gasketMass * quantity,
      blankArea:
        (input.gasketLength * input.gasketWidth * quantity) / MM2_IN_M2,
    },
  ]

  const netSteelMass = rows
    .filter((row) => row.material.startsWith('Сталь'))
    .reduce((sum, row) => sum + row.batchMass, 0)
  const netGasketMass = gasketMass * quantity
  const purchaseSteelMass = netSteelMass * wasteFactor
  const purchaseGasketMass = netGasketMass * wasteFactor

  const baseSurface =
    2 *
    (input.baseLength * input.baseWidth +
      input.baseLength * input.baseThickness +
      input.baseWidth * input.baseThickness)
  const saddleSurface =
    2 *
    (arcLength * input.saddleWidth +
      arcLength * input.saddleThickness +
      input.saddleWidth * input.saddleThickness)
  const ribHypotenuse = Math.hypot(input.ribLength, input.ribHeight)
  const ribSurface =
    2 * ribFaceArea +
    (input.ribLength + input.ribHeight + ribHypotenuse) * input.ribThickness
  const paintArea =
    ((baseSurface +
      saddleSurface +
      ribSurface * input.ribsPerSupport) *
      quantity) /
    MM2_IN_M2

  const steelCost = purchaseSteelMass * input.steelPrice
  const gasketCost = purchaseGasketMass * input.gasketPrice
  const paintCost = paintArea * input.paintPrice
  const totalCost = steelCost + gasketCost + paintCost
  const netMass = netSteelMass + netGasketMass

  return {
    rows,
    netSteelMass,
    netGasketMass,
    netMass,
    purchaseSteelMass,
    purchaseGasketMass,
    purchaseMass: purchaseSteelMass + purchaseGasketMass,
    paintArea,
    steelCost,
    gasketCost,
    paintCost,
    totalCost,
    costPerSupport: quantity ? totalCost / quantity : 0,
    massPerSupport: quantity ? netMass / quantity : 0,
  }
}
