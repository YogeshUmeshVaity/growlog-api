/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { LoggerService } from '@nestjs/common'
/**
 * Disables logging. This is useful for tests. To use this, after creating the test module with
 * createTestingModule(), call the modules function useLogger() and provide the 'new EmptyLogger()'
 * to it.
 */
export class EmptyLogger implements LoggerService {
  log(message: string): any {}
  error(message: string, trace: string): any {}
  warn(message: string): any {}
  debug(message: string): any {}
  verbose(message: string): any {}
}
