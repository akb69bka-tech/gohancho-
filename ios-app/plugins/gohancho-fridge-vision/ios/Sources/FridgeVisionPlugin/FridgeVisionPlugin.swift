import Foundation
import Capacitor
import Vision
import UIKit

/// 冷蔵庫の写真を、iPhone の中だけで分類する（Apple Vision の VNClassifyImageRequest。無料・オフライン・外部送信なし）。
/// - 受け取るのは JS が縮小した JPEG の base64（メモリ上だけ）。ファイルにも書かず、ネットワークも使わない。
/// - 返すのは分類ラベルと確信度だけ。ラベル → 食材名の対応と、利用者の確認は JS 側（gohancho/index.html の FRIDGE_LABELS）。
@objc(FridgeVisionPlugin)
public class FridgeVisionPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "FridgeVisionPlugin"
    public let jsName = "FridgeVision"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "classify", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "vocabulary", returnType: CAPPluginReturnPromise)
    ]

    /// classify({ image: <base64 JPEG>, minConfidence?: 0.1 }) -> { labels: [{ identifier, confidence }] }（確信度の高い順・最大40件）
    @objc func classify(_ call: CAPPluginCall) {
        guard let b64 = call.getString("image"),
              let data = Data(base64Encoded: b64, options: .ignoreUnknownCharacters),
              let cg = UIImage(data: data)?.cgImage else {
            call.reject("bad image")
            return
        }
        let minConf = Float(call.getDouble("minConfidence") ?? 0.1)
        DispatchQueue.global(qos: .userInitiated).async {
            let request = VNClassifyImageRequest()
            let handler = VNImageRequestHandler(cgImage: cg, options: [:])
            do {
                try handler.perform([request])
                let found = (request.results ?? [])
                    .filter { $0.confidence >= minConf }
                    .sorted { $0.confidence > $1.confidence }
                    .prefix(40)
                    .map { ["identifier": $0.identifier, "confidence": Double($0.confidence)] as [String: Any] }
                call.resolve(["labels": found])
            } catch {
                call.reject("classify failed")
            }
        }
    }

    /// vocabulary() -> { labels: [String] }  この iOS の Vision が返しうるラベルの全部。
    /// 実機で一度呼んで、JS 側の対応表（FRIDGE_LABELS）のラベルが実在するか確かめるために使う（アプリの通常の動作では呼ばない）。
    @objc func vocabulary(_ call: CAPPluginCall) {
        do {
            let all = try VNClassifyImageRequest().supportedIdentifiers()
            call.resolve(["labels": all])
        } catch {
            call.reject("vocabulary failed")
        }
    }
}
