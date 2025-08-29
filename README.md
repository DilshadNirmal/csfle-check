# MongoDB Client-Side Field Level Encryption (CSFLE) Demo

## 🔐 Overview

This project demonstrates **MongoDB Client-Side Field Level Encryption (CSFLE)** implementation with high-performance sensor data management. It showcases both manual and automatic encryption/decryption approaches optimized for large-scale IoT sensor data processing.

## 🚀 Key Features

- **Client-Side Field Level Encryption** using MongoDB's native CSFLE
- **Hybrid Encryption Strategy**: Manual encryption with automatic decryption
- **High-Performance Data Retrieval** with multiple optimization strategies
- **Scalable Architecture** supporting thousands of sensor records
- **Multiple API Endpoints** optimized for different use cases
- **Performance Benchmarking** tools included

## 📊 Performance Highlights

- **Count Only**: 22ms (ultra-fast record counting)
- **Latest Records**: 9ms (recent data retrieval)
- **Metadata Retrieval**: ~900ms for 100 records
- **Full Decryption**: Available on-demand per record
- **Bulk Operations**: Optimized for high-throughput scenarios

## 🏗️ Architecture

### Encryption Strategy

- **Manual Encryption**: Individual sensor fields encrypted during insertion
- **Automatic Decryption**: MongoDB handles decryption transparently during queries
- **Randomized Algorithm**: `AEAD_AES_256_CBC_HMAC_SHA_512-Random` for double support

### Database Optimization

- **Compound Indexes**: Optimized for timestamp and device-based queries
- **Projection Queries**: Metadata-only retrieval for fast listings
- **Pagination Support**: Built-in pagination for large datasets

## 🛠️ Technology Stack

- **Backend**: Node.js with Express
- **Database**: MongoDB with CSFLE
- **Encryption**: MongoDB ClientEncryption
- **ODM**: Mongoose
- **Performance**: Custom optimization strategies

## 📁 Project Structure

```
├── app/
│   ├── server.js              # Main server with optimized endpoints
│   ├── helper/
│   │   ├── csfle.js          # CSFLE configuration
│   │   └── createDataKey.js   # Data key management
│   ├── models/
│   │   ├── sensorSchema.js    # Sensor data schema
│   │   └── efficientSensorSchema.js
│   └── workers/
│       └── decrypt-worker.js  # Worker thread for parallel processing
├── test-performance.js        # Performance benchmarking
├── test-individual-encryption.js
├── master-key.txt            # Encryption master key
└── .env                      # Environment configuration
```

## 🚦 API Endpoints

### Fast Endpoints (Optimized)

- `GET /api/sensor-data` - Fast metadata retrieval (default)
- `GET /api/sensor-data/count` - Ultra-fast record counting
- `GET /api/sensor-data/latest` - Recent records (9ms response)
- `GET /api/sensor-data/decrypt/:id` - Individual record decryption

### Full-Featured Endpoints

- `GET /api/sensor-data?decrypt=true` - Full decryption (slower)
- `GET /api/sensor-data/stream` - Paginated streaming
- `POST /api/sensor-data` - Manual encryption insertion
- `POST /api/sensor-data/bulk` - Bulk operations

## 🔧 Setup Instructions

### Prerequisites

- Node.js (v16+)
- MongoDB (v6.0+ with CSFLE support)
- MongoDB Atlas or local MongoDB instance

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/mongodb-csfle-demo.git
   cd mongodb-csfle-demo
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB connection string
   ```

4. **Generate Encryption Keys**

   ```bash
   node app/helper/createDataKey.js
   ```

5. **Start the server**

   ```bash
   node app/server.js
   ```

6. **Run performance tests**
   ```bash
   node test-performance.js
   ```

## 📈 Performance Testing

The project includes comprehensive performance benchmarking:

```bash
# Run all performance tests
node test-performance.js

# Test individual encryption
node test-individual-encryption.js
```

Expected results:

- Metadata queries: <100ms
- Count operations: <50ms
- Latest records: <20ms
- Full decryption: Variable based on dataset size

## 🤝 Contributing

We welcome contributions to improve this CSFLE implementation! Here's how you can help:

### Getting Started

1. **Fork this repository** to your GitHub account
2. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** and test thoroughly
4. **Commit with clear messages**:
   ```bash
   git commit -m "Add: Description of your changes"
   ```
5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
6. **Create a Pull Request** with detailed description

### Contribution Guidelines

- **Code Quality**: Follow existing code style and patterns
- **Testing**: Add tests for new features
- **Documentation**: Update README for significant changes
- **Performance**: Consider performance impact of changes
- **Security**: Ensure encryption best practices

### Areas for Contribution

- Performance optimizations
- Additional encryption algorithms
- Enhanced error handling
- Monitoring and logging improvements
- Documentation enhancements
- Test coverage expansion

## 🔒 Security Considerations

- **Master Key Management**: Store master keys securely in production
- **Environment Variables**: Never commit sensitive data
- **Access Control**: Implement proper authentication/authorization
- **Key Rotation**: Plan for regular key rotation strategies
- **Audit Logging**: Monitor encryption/decryption operations

## 📚 Learning Resources

- [MongoDB CSFLE Documentation](https://docs.mongodb.com/manual/core/security-client-side-encryption/)
- [CSFLE Best Practices](https://docs.mongodb.com/manual/core/csfle/fundamentals/)
- [Performance Optimization Guide](https://docs.mongodb.com/manual/administration/analyzing-mongodb-performance/)

## 🐛 Issues and Support

If you encounter any issues or have questions:

1. **Check existing issues** in the GitHub repository
2. **Create a new issue** with detailed description and steps to reproduce
3. **Include system information** (Node.js version, MongoDB version, OS)
4. **Provide error logs** and relevant code snippets

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- MongoDB team for CSFLE implementation
- Contributors who help improve this project
- Community feedback and suggestions

---

**Note**: This is a demonstration project. For production use, please review security practices, implement proper authentication, and follow your organization's security guidelines.

## 📞 Contact

For questions or collaboration opportunities, please open an issue or reach out through GitHub.

---

**Happy Coding! 🚀**
