package com.microfocus.example

import scala.concurrent.duration._

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import io.gatling.jdbc.Predef._

class Gatling extends Simulation {

	val httpProtocol = http
		.baseUrl("http://www.advantageonlineshopping.com")
		.inferHtmlResources()
		.acceptHeader("application/json, text/plain, */*")
		.acceptEncodingHeader("gzip, deflate")
		.acceptLanguageHeader("en-US,en;q=0.9")
		.userAgentHeader("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.75 Safari/537.36")

	val headers_0 = Map(
		"Accept" -> "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3",
		"Proxy-Connection" -> "keep-alive",
		"Upgrade-Insecure-Requests" -> "1")

	val headers_1 = Map(
		"Accept" -> "*/*",
		"Proxy-Connection" -> "keep-alive")

	val headers_2 = Map(
		"Accept" -> "*/*",
		"Origin" -> "http://www.advantageonlineshopping.com",
		"Proxy-Connection" -> "keep-alive")

	val headers_5 = Map("Proxy-Connection" -> "keep-alive")

	val headers_6 = Map(
		"Accept" -> "application/xml, text/xml, */*; q=0.01",
		"Content-Type" -> "text/xml; charset=UTF-8",
		"Origin" -> "http://www.advantageonlineshopping.com",
		"Proxy-Connection" -> "keep-alive",
		"SOAPAction" -> "com.advantage.online.store.accountserviceGetAccountConfigurationRequest",
		"X-Requested-With" -> "XMLHttpRequest")

	val headers_11 = Map(
		"Accept" -> "text/html",
		"Proxy-Connection" -> "keep-alive")

	val headers_17 = Map(
		"Accept" -> "image/webp,image/apng,image/*,*/*;q=0.8",
		"Proxy-Connection" -> "keep-alive")



	val scn = scenario("Gatling")
		.exec(http("request_0")
			.get("/")
			.headers(headers_0)
			.resources(http("request_1")
			.get("/services.properties")
			.headers(headers_1),
            http("request_2")
			.get("/css/fonts/roboto_regular_macroman/Roboto-Regular-webfont.woff")
			.headers(headers_2),
            http("request_3")
			.get("/css/fonts/roboto_light_macroman/Roboto-Light-webfont.woff")
			.headers(headers_2),
            http("request_4")
			.get("/css/fonts/roboto_medium_macroman/Roboto-Medium-webfont.woff")
			.headers(headers_2),
            http("request_5")
			.get("/catalog/api/v1/DemoAppConfig/parameters/by_tool/ALL")
			.headers(headers_5),
            http("request_6")
			.post("/accountservice/GetAccountConfigurationRequest")
			.headers(headers_6)
			.body(RawFileBody("com/microfocus/example/gatling/0006_request.dat")),
            http("request_7")
			.get("/catalog/api/v1/categories")
			.headers(headers_5),
            http("request_8")
			.get("/catalog/api/v1/categories/all_data")
			.headers(headers_5)
			.check(status.is(500)),
            http("request_9")
			.get("/catalog/api/v1/deals/search?dealOfTheDay=true")
			.headers(headers_5),
            http("request_10")
			.get("/app/tempFiles/popularProducts.json")
			.headers(headers_5),
            http("request_11")
			.get("/app/views/home-page.html")
			.headers(headers_11),
            http("request_12")
			.get("/css/fonts/roboto_bold_macroman/Roboto-Bold-webfont.woff")
			.headers(headers_2),
            http("request_13")
			.get("/css/fonts/roboto_thin_macroman/Roboto-Thin-webfont.woff")
			.headers(headers_2)))
		.pause(3)
		.exec(http("request_14")
			.get("/catalog/api/v1/categories/4/products")
			.headers(headers_5)
			.resources(http("request_15")
			.get("/catalog/api/v1/categories/attributes")
			.headers(headers_5),
            http("request_16")
			.get("/app/views/category-page.html")
			.headers(headers_11),
            http("request_17")
			.get("/catalog/fetchImage?image_id=7839")
			.headers(headers_17)
			.check(status.is(500)),
            http("request_18")
			.get("/catalog/fetchImage?image_id=4300")
			.headers(headers_17),
            http("request_19")
			.get("/catalog/fetchImage?image_id=4700")
			.headers(headers_17),
            http("request_20")
			.get("/catalog/fetchImage?image_id=4600")
			.headers(headers_17),
            http("request_21")
			.get("/catalog/fetchImage?image_id=4400")
			.headers(headers_17),
            http("request_22")
			.get("/catalog/fetchImage?image_id=4500")
			.headers(headers_17),
            http("request_23")
			.get("/css/images/category_banner_4.png")
			.headers(headers_17)))
		.pause(10)
		.exec(http("request_24")
			.get("/catalog/api/v1/products/25")
			.headers(headers_5)
			.resources(http("request_25")
			.get("/catalog/api/v1/categories/4/products")
			.headers(headers_5),
            http("request_26")
			.get("/app/views/product-page.html")
			.headers(headers_11),
            http("request_27")
			.get("/catalog/api/v1/categories/all_data")
			.headers(headers_5)
			.check(status.is(500))))

	setUp(scn.inject(atOnceUsers(1))).protocols(httpProtocol)
}