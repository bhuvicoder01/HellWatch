import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

class AuthService {
  static String get baseUrl {
    if (kIsWeb || Platform.isAndroid || Platform.isIOS) {
      return 'https://hellwatch-ffus.onrender.com';
    }
    return 'http://localhost:5000';
  }

  static const _storage = FlutterSecureStorage();

  static Future<bool> register(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'email': email, 'password': password}),
    );

    if (response.statusCode == 201) {
      final data = json.decode(response.body);
      await _storage.write(key: 'token', value: data['token']);
      return true;
    }
    return false;
  }

  static Future<bool> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'email': email, 'password': password}),
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      await _storage.write(key: 'token', value: data['token']);
      await _storage.write(key: 'user', value: json.encode(data['user']));
      return true;
    }
    return false;
  }

  static Future<void> logout() async {
    await _storage.delete(key: 'token');
  }

  static Future<bool> isLoggedIn() async {
    final token = await _storage.read(key: 'token');
    return token != null;
  }

  static Future<String?> getToken() async {
    return await _storage.read(key: 'token');
  }

  static Future<http.Response> makeAuthenticatedRequest(
      String endpoint, Map<String, String> headers, String method,
      [Map<String, dynamic>? body]) async {
    final token = await getToken();
    headers['Authorization'] = 'Bearer $token';

    final url = Uri.parse('$baseUrl$endpoint');

    switch (method) {
      case 'GET':
        return await http.get(url, headers: headers);
      case 'POST':
        return await http.post(url, headers: headers, body: json.encode(body));
      case 'PUT':
        return await http.put(url, headers: headers, body: json.encode(body));
      case 'DELETE':
        return await http.delete(url, headers: headers);
      default:
        throw Exception('Unsupported HTTP method');
    }
  }

  static Future<void> clearStorage() async {
    await _storage.deleteAll();
  }

  static Future<Map<String, dynamic>?> getCurrentUser() async {
    try {
      final response = await makeAuthenticatedRequest('/auth/me', {}, 'GET');
      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      return null;
    } catch (e) {
      return null;
    }
  }
}
