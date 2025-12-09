export type Env = {
	id: number;
	schedule: string;
	method: string;
	url: string;
	props?: Record<string, string>;
};
