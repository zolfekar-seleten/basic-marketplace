import { ValidateBy, ValidationArguments } from 'class-validator';

export function MaxBcryptPasswordBytes(maxBytes: number) {
  return ValidateBy({
    name: 'maxBcryptPasswordBytes',
    constraints: [maxBytes],
    validator: {
      validate(value: unknown, args?: ValidationArguments) {
        const limit = args?.constraints[0] as number;
        return (
          typeof value === 'string' && Buffer.byteLength(value, 'utf8') <= limit
        );
      },
      defaultMessage: () =>
        `password must be at most ${maxBytes} bytes when UTF-8 encoded`,
    },
  });
}
