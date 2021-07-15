type MonitorCondition = MonitorConditionRefining | MonitorConditionPrice
  | MonitorConditionSlot | MonitorConditionNoneSlot | MonitorConditionOption | MonitorConditionNoneOption;

interface MonitorConditionRefining {
  type: 'refining';
  operator: '<=' | '=' | '>=';
  value: number;
}

interface MonitorConditionPrice {
  type: 'price';
  operator: '<=' | '>=';
  value: number;
}

interface MonitorConditionSlot {
  type: 'slot';
  operator: '<=' | '=' | '>=';
  itemId: number;
  quantity: 0 | 1 | 2 | 3 | 4;
}

interface MonitorConditionNoneSlot {
  type: 'slot';
  operator: 'none';
}

interface MonitorConditionOption {
  type: 'option';
  operator: '<=' | '=' | '>=';
  optionId: number;
  value: number;
}

interface MonitorConditionNoneOption {
  type: 'option';
  operator: 'none';
}

export default MonitorCondition;
