import { Entity } from '../../../../shared/core/entity';

export type GatewayCustomerProps = {
  gatewayCustomerId: string;
  name: string;
  email: string;
  document: string;
};

export class GatewayCustomer extends Entity<GatewayCustomerProps> {
  protected validate(): void {}

  static create(props: GatewayCustomerProps, id?: string): GatewayCustomer {
    return new GatewayCustomer(props, id);
  }

  get gatewayCustomerId() {
    return this.props.gatewayCustomerId;
  }

  get name() {
    return this.props.name;
  }

  get email() {
    return this.props.email;
  }

  get document() {
    return this.props.document;
  }
}
