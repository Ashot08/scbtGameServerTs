import { ReadOptions } from './User.ts';

export default abstract class BaseModel {
  public abstract create?(data: unknown): Promise<unknown>

  public abstract read?(options: ReadOptions): Promise<unknown>

  public abstract update?(id: string, data: unknown): Promise<unknown>

  public abstract delete?(id: string): Promise<unknown>
}
