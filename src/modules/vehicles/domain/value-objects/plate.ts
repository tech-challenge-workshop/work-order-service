import { InvalidPlateError } from '../errors/vehicle.errors'

const PLATE_PATTERN = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/

export class Plate {
  private constructor(readonly value: string) {}

  static create(raw: string): Plate {
    const normalized = raw.trim().toUpperCase().replace(/-/g, '')

    if (!PLATE_PATTERN.test(normalized)) {
      throw new InvalidPlateError(raw)
    }

    return new Plate(normalized)
  }

  equals(other: Plate): boolean {
    return this.value === other.value
  }
}
