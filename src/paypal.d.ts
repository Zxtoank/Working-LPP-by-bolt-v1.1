declare global {
  interface Window {
    paypal: {
      Buttons: (config: {
        createOrder: (data: any, actions: any) => Promise<any>;
        onApprove: (data: any, actions: any) => Promise<void>;
        onError: (err: any) => void;
        onCancel: () => void;
      }) => {
        render: (selector: string) => void;
      };
    };
  }
}

export {};