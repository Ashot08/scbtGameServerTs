export default abstract class BaseModel {
  protected constructor() {

  }
  public abstract create?(data: unknown): Promise<unknown>

  public abstract read?(id?: string): Promise<unknown>

  public abstract update?(id: string, data: unknown): Promise<unknown>

  public abstract delete?(id: string): Promise<unknown>
}
