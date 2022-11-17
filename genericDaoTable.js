const Table = require('./Table');

const TableName = 'divmaplaque';

const VARIABLES_PK = "VAR";
const LAST_PLATE_SK = "LAST_PLATE";

class DivMaPlaqueDao extends Table {
  constructor() {
    super(
      {
        // Parametrization supported for the name so it can be user configured.
        TableName,
        HashKey: "pk",
      },
      // These are custom options that the Table class understands
      {
        // Which parameters are auto-generated with uuid.v1() which is time dependant.
        uuid: [],
        // Whether to add timestamps to the entries.
        timestamps: true,
        ttl: false,
      }
    );
  }

  delete(pk, sk) {
    return super.delete({ pk, sk });
  }

  get(pk, sk) {
    return super.get({ pk, sk });
  }

  async getLastPlate() {
    const getResult = await this.get(VARIABLES_PK, LAST_PLATE_SK);
    return getResult.value;
  }


  putLastPlate(lastValue) {
    return super.put({
      pk: VARIABLES_PK,
      sk: LAST_PLATE_SK,
      value: lastValue,
    });
  }

  storeStatus(plaque, status) {
    return super.put({
      pk: `STATUS_PLATE_${plaque}`,
      sk: status,
      plaque,
      status
    });
  }

}

module.exports = new DivMaPlaqueDao();