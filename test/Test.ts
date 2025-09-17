import assert from "assert";
import { 
  TestHelpers,
  ERC1967Proxy_DataGroupConsensusUpdated
} from "generated";
const { MockDb, ERC1967Proxy } = TestHelpers;

describe("ERC1967Proxy contract DataGroupConsensusUpdated event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for ERC1967Proxy contract DataGroupConsensusUpdated event
  const event = ERC1967Proxy.DataGroupConsensusUpdated.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("ERC1967Proxy_DataGroupConsensusUpdated is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await ERC1967Proxy.DataGroupConsensusUpdated.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualERC1967ProxyDataGroupConsensusUpdated = mockDbUpdated.entities.ERC1967Proxy_DataGroupConsensusUpdated.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedERC1967ProxyDataGroupConsensusUpdated: ERC1967Proxy_DataGroupConsensusUpdated = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      dataGroupHash: event.params.dataGroupHash,
      oldValue: event.params.oldValue,
      newValue: event.params.newValue,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualERC1967ProxyDataGroupConsensusUpdated, expectedERC1967ProxyDataGroupConsensusUpdated, "Actual ERC1967ProxyDataGroupConsensusUpdated should be the same as the expectedERC1967ProxyDataGroupConsensusUpdated");
  });
});
