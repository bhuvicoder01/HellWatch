import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthService {
  static const String baseUrl = 'http://localhost:5000';
  static const _storage = FlutterSecureStorage();
  
  static Future<bool> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'email': email, 'password': password}),
    );
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      await _storage.write(key: 'token', value: data['token']);
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
}