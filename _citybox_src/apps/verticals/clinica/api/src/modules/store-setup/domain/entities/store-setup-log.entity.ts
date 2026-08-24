export type StoreSetupLogProps = {
  storeId: string;
  version: number;
  completedAt: Date;
};

export class StoreSetupLog {
  constructor(private readonly props: StoreSetupLogProps) {}

  public static create(props: StoreSetupLogProps): StoreSetupLog {
    return new StoreSetupLog(props);
  }

  get storeId() {
    return this.props.storeId;
  }
  get version() {
    return this.props.version;
  }
  get completedAt() {
    return this.props.completedAt;
  }
}
