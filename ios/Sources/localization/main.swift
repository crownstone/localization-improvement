import ArgumentParser
import Foundation
import SwiftyJSON
import BluenetLocalization
import BluenetShared

struct iBeaconPacket: iBeaconPacketProtocol {
    public var idString: String
    public var rssi : NSNumber
}

struct LocalizationSet: ParsableCommand {
    @Argument(help: "fingerprint.")
    var fingerprintPath: String

    @Argument(help: "datasetPath..")
    var datasetPath: String
    
    @Argument(help: "outputPath.")
    var outputPath: String


    mutating func run() throws {
        print("Using fingerprintPath", fingerprintPath)
        print("Using datasetPath", datasetPath)
        print("Using outputPath", outputPath)
        let fingerprintData = try Data(contentsOf: URL(fileURLWithPath: fingerprintPath))
        let fingerprintJSON = try JSON(data: fingerprintData)
        
        let datasetData = try Data(contentsOf: URL(fileURLWithPath: datasetPath))
        let datasetJSON = try JSON(data: datasetData)
        
        var results = [[String: Any]]()
        
        let naiveBayesianClassifier = CrownstoneBasicClassifier()

        for fingerprint in fingerprintJSON {
            let json = fingerprint.1
            naiveBayesianClassifier.loadTrainingData(
                json["locationId"].stringValue,
                referenceId: json["sphereId"].stringValue,
                trainingData: json["data"].stringValue
            )
        }

        for datapoint in datasetJSON {
            let data = datapoint.1
            let sphereId = data["sphereId"].stringValue
            
            var inputVector = [iBeaconPacketProtocol]()
            for point in data["in"].arrayValue {
                inputVector.append(iBeaconPacket(idString: point[0].stringValue, rssi: point[1].numberValue))
            }

            let result = naiveBayesianClassifier.classifyRaw(inputVector, referenceId: sphereId)
            results.append([
                            "result":        result as Any,
                            "expectedLabel": data["label"].stringValue,
                            "probabilities": naiveBayesianClassifier.getProbabilities(sphereId) as Any
                        ])
        }
        
        
        
        let jsonData = JSON(["NaiveBayesian": results])
        let data = try jsonData.rawData()
        try! data.write(to: URL(fileURLWithPath: outputPath))
    }
}

LocalizationSet.main()
