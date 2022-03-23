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
        
        var NaiveBayesianResults = [[String: Any]]()
        var kNNResults = [[String: Any]]()
        
        let naiveBayesianClassifier = CrownstoneBasicClassifier(useSmoothing: false)
        let knnClassifier = Forest(useSmoothing: false)
//        knnClassifier.setDebugging(debug: true)

        for fingerprint in fingerprintJSON {
            let json = fingerprint.1
            naiveBayesianClassifier.loadTrainingData(
                json["locationId"].stringValue,
                referenceId: json["sphereId"].stringValue,
                trainingData: json["data"].rawString()!
            )
            
            knnClassifier.loadTrainingData(
                json["locationId"].stringValue,
                referenceId: json["sphereId"].stringValue,
                trainingData: json["data"].rawString()!
            )
        }

        knnClassifier.start()
        var count = 0
        for datapoint in datasetJSON {
            let data = datapoint.1
            let sphereId = data["sphereId"].stringValue
            
            var inputVector = [iBeaconPacketProtocol]()
            for point in data["in"].arrayValue {
                inputVector.append(iBeaconPacket(idString: point[0].stringValue, rssi: point[1].numberValue))
            }
            
            let NaiveBayesianResult = naiveBayesianClassifier.classify(inputVector, referenceId: sphereId)
            let kNNResult = knnClassifier.classify(inputVector, referenceId: sphereId)
            NaiveBayesianResults.append([
                            "sphereId":      sphereId,
                            "result":        NaiveBayesianResult as Any,
                            "expectedLabel": data["label"].stringValue,
//                            "probabilities": naiveBayesianClassifier.getProbabilities(sphereId) as Any
                        ])
            
            kNNResults.append([
                            "sphereId":      sphereId,
                            "result":        kNNResult as Any,
                            "expectedLabel": data["label"].stringValue,
//                            "distanceMap":   knnClassifier.getDistanceMap(sphereId) as Any
                        ])
            
            
        }
        
        
        
        let jsonData = JSON(["naiveBayesian": NaiveBayesianResults, "kNN": kNNResults])
        let data = try jsonData.rawData()
        try! data.write(to: URL(fileURLWithPath: outputPath))
    }
}

LocalizationSet.main()
